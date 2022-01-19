/* eslint-disable @typescript-eslint/no-unused-vars, no-new */

const kIsEventTarget = ('__event_target');
const kEvents = ('__kEvents');
const kStop = ('__kStop');
const kTarget = ('__kTarget');
const kNewListener = ('__kNewListener');
const kMaxListeners = ('__kMaxListeners');
const kMaxListenersWarned = ('__kMaxListenersWarned');

// TODO(joyeecheung): V8 snapshot does not support instance member
// initializers for now:
// https://bugs.chromium.org/p/v8/issues/detail?id=10704
const kType = ('__type');
const kDefaultPrevented = ('__defaultPrevented');
const kCancelable = ('__cancelable');
const kTimestamp = ('__timestamp');
const kBubbles = ('__bubbles');
const kComposed = ('__composed');
const kPropagationStopped = ('__propagationStopped');

interface UserEventOptions {
  composed?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

interface UserListenerOptions {
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}

export class Event<T> {
  private [kCancelable] = true;
  private [kBubbles] = false;
  private [kComposed] = false;
  private [kType]: T;
  private [kDefaultPrevented] = false;
  private [kTimestamp] = 0;
  private [kPropagationStopped] = false;
  private [kTarget]: any = null;
  private [kStop] = false;

  constructor(type: T, options?: UserEventOptions) {
    if (arguments.length === 0) {
      throw new Error('invalid event');
    }
    const { cancelable = true, bubbles, composed } = { ...options };
    this[kCancelable] = !!cancelable;
    this[kBubbles] = !!bubbles;
    this[kComposed] = !!composed;
    this[kType] = type;
    this[kDefaultPrevented] = false;
    this[kTimestamp] = Date.now();
    this[kPropagationStopped] = false;
    this[kTarget] = null;
  }

  stopImmediatePropagation() {
    this[kStop] = true;
  }

  preventDefault() {
    this[kDefaultPrevented] = true;
  }

  readonly isTrusted = false;

  get target() { return this[kTarget]; }

  get currentTarget() { return this[kTarget]; }

  get srcElement() { return this[kTarget]; }

  get type() { return this[kType]; }

  get cancelable() { return this[kCancelable]; }

  get defaultPrevented() {
    return this[kCancelable] && this[kDefaultPrevented];
  }

  get timeStamp() { return this[kTimestamp]; }

  // The following are non-op and unused properties/methods from Web API UserEvent.
  // These are not supported in Node.js and are provided purely for
  // API completeness.

  composedPath() { return this[kTarget] ? [this[kTarget]] : []; }
  get returnValue() { return !this.defaultPrevented; }
  get bubbles() { return this[kBubbles]; }
  get composed() { return this[kComposed]; }
  get eventPhase() {
    return this[kTarget] ? Event.AT_TARGET : Event.NONE;
  }
  get cancelBubble() { return this[kPropagationStopped]; }
  set cancelBubble(value) {
    if (value) {
      this.stopPropagation();
    }
  }
  stopPropagation() {
    this[kPropagationStopped] = true;
  }

  static NONE = 0;
  static CAPTURING_PHASE = 1;
  static AT_TARGET = 2;
  static BUBBLING_PHASE = 3;
}

type ListenerFunction<EventType> = (event: EventType) => any;
type UserListener<EventType> = ListenerFunction<EventType> | { handleEvent: ListenerFunction<EventType> };

interface ListenerRoot<EventType> {
  size: number;
  next: ListenerNode<EventType> | undefined;
}

// The listeners for an EventTarget are maintained as a linked list.
// Unfortunately, the way EventTarget is defined, listeners are accounted
// using the tuple [handler,capture], and even if we don't actually make
// use of capture or bubbling, in order to be spec compliant we have to
// take on the additional complexity of supporting it. Fortunately, using
// the linked list makes dispatching faster, even if adding/removing is
// slower.
class ListenerNode<EventType> {
  next: ListenerNode<EventType> | undefined = undefined;
  previous: ListenerNode<EventType> | ListenerRoot<EventType> | undefined = undefined;
  listener: UserListener<EventType>;
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
  callback: (event: EventType) => any;

  removed = false;

  constructor(previous: ListenerNode<EventType> | ListenerRoot<EventType>, listener: UserListener<EventType>, once?: boolean, capture?: boolean, passive?: boolean) {
    this.next = undefined;
    if (previous !== undefined) previous.next = this;
    this.previous = previous;
    this.listener = listener;
    this.once = once;
    this.capture = capture;
    this.passive = passive;

    this.callback =
      typeof listener === 'function' ?
        listener :
        listener.handleEvent.bind(listener);
  }

  same(listener: UserListener<EventType>, capture: boolean) {
    return this.listener === listener && this.capture === capture;
  }

  remove() {
    if (this.previous !== undefined) this.previous.next = this.next;
    if (this.next !== undefined) this.next.previous = this.previous;
    this.removed = true;
  }
}

type Unpacked<T> = T extends Array<infer U> ? U : T;

type ExtractEventType<EventUnion, K> = Extract<EventUnion, { type: K }>;

export class EventTarget<Events extends Array<Event<any>>, K extends Events[number]['type'] = Events[number]['type'], EventUnion extends Unpacked<Events> = Unpacked<Events>> {
  static [kIsEventTarget] = true;
  static defaultMaxListeners = 0;

  [kEvents]: Map<K, ListenerRoot<ExtractEventType<EventUnion, K>>>;

  [kMaxListenersWarned] = false;

  [kMaxListeners]: number;

  constructor() {
    this[kEvents] = new Map<any, any>();
    // eslint-disable-next-line no-use-before-define
    this[kMaxListeners] = EventTarget.defaultMaxListeners;
    this[kMaxListenersWarned] = false;
  }

  [kNewListener]<T extends K>(size: number, type: T) {
    if (this[kMaxListeners] > 0 &&
      size > this[kMaxListeners] &&
      !this[kMaxListenersWarned]) {
      this[kMaxListenersWarned] = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      const w: any = new Error('Possible EventTarget memory leak detected. ' +
        `${size} ${type} listeners. Use ` +
        'setMaxListeners() to increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.target = this;
      w.type = type;
      w.count = size;
      console.warn(w);
    }
  }

  addEventListener<T extends K>(type: T, listener: UserListener<ExtractEventType<EventUnion, T>>, options: UserListenerOptions = {}) {
    if (arguments.length < 2) throw new Error('invalid addEventListener');

    // We validateOptions before the shouldAddListeners check because the spec
    // requires us to hit getters.
    const {
      once = false,
      capture = false,
      passive = false,
    } = options;

    if (!shouldAddListener(listener)) {
      // The DOM silently allows passing undefined as a second argument
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      const w: any = new Error(`addEventListener called with ${listener}` +
        ' which has no effect.');
      w.name = 'AddEventListenerArgumentTypeWarning';
      w.target = this;
      w.type = type;
      console.warn(w);
      return;
    }

    let root = this[kEvents].get(type);

    if (root === undefined) {
      root = { size: 1, next: undefined };
      // This is the first handler in our linked list.
      new ListenerNode(root, listener, once, capture, passive);
      this[kNewListener](root.size, type);
      this[kEvents].set(type, root);
      return;
    }

    let handler = root.next;
    let previous: ListenerRoot<ExtractEventType<EventUnion, T>> | ListenerNode<ExtractEventType<EventUnion, T>> = root;

    // We have to walk the linked list to see if we have a match
    while (handler !== undefined && !handler.same(listener, capture)) {
      previous = handler;
      handler = handler.next;
    }

    if (handler !== undefined) { // Duplicate! Ignore
      return;
    }

    new ListenerNode(previous, listener, once, capture, passive);
    root.size++;
    this[kNewListener](root.size, type);
  }

  removeEventListener<T extends K>(type: T, listener: UserListener<ExtractEventType<EventUnion, T>>, options: UserListenerOptions = {}) {
    if (!shouldAddListener(listener)) return;

    // TODO(@jasnell): If it's determined this cannot be backported
    // to 12.x, then this can be simplified to:
    //   const capture = Boolean(options?.capture);
    const capture = options != null && options.capture === true;

    const root = this[kEvents].get(type);
    if (root === undefined || root.next === undefined) return;

    let handler: ListenerNode<ExtractEventType<EventUnion, T>> | undefined = root.next;
    while (handler !== undefined) {
      if (handler.same(listener, capture)) {
        handler.remove();
        root.size--;
        if (root.size === 0) {
          this[kEvents].delete(type);
        }
        break;
      }
      handler = handler.next;
    }
  }

  dispatchEvent<T extends K>(event: ExtractEventType<EventUnion, T>) {
    if (!(event instanceof Event)) throw new Error('invalid event');

    const { type } = event;
    event[kTarget] = this;
    const root = this[kEvents].get(type);
    if (root === undefined || root.next === undefined) return true;

    let handler: ListenerNode<ExtractEventType<EventUnion, K>> | undefined = root.next;
    let next;

    while (handler !== undefined &&
      (handler.passive || event[kStop] !== true)) {
      // Cache the next item in case this iteration removes the current one
      next = handler.next;

      if (handler.removed) {
        // Deal with the case an event is removed while event handlers are
        // Being processed (removeEventListener called from a listener)
        handler = next;
        continue;
      }

      if (handler.once) {
        handler.remove();
        root.size--;
      }

      try {
        const result = handler.callback.call(this, event);
        if (result !== undefined && result !== null) addCatch(this, result);
      } catch (err) {
        console.error(err);
      }

      handler = next;
    }

    if (event !== undefined) event[kTarget] = undefined;

    return event.defaultPrevented !== true;
  }

  setMaxListeners(n: number) {
    this[kMaxListeners] = n;
    return this;
  }

  getMaxListeners() {
    return this[kMaxListeners];
  }

  eventNames() {
    return Array.from(this[kEvents].keys());
  }

  listenerCount<T extends K>(type: T) {
    const root = this[kEvents].get(type);
    return root !== undefined ? root.size : 0;
  }


  removeAllEventListeners<T extends K>(type: T) {
    if (type !== undefined) {
      this[kEvents].delete(type);
    } else {
      this[kEvents].clear();
    }

    return this;
  }
}

// EventTarget API

function shouldAddListener(listener: UserListener<any>) {
  if (typeof listener === 'function' ||
    (listener != null &&
      typeof listener === 'object' &&
      typeof listener.handleEvent === 'function')) {
    return true;
  }

  if (listener == null) return false;

  throw new Error('invalid listener!');
}

function addCatch(_: any, promise: Promise<any>) {
  const { then } = promise;
  if (typeof then === 'function') {
    then.call(promise, undefined, (err: any) => {
      console.error(err);
    });
  }
}