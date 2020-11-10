## ts-event-target

nodejs event target with full typescript type support.

### usage

```ts
import { Event, EventTarget} from 'ts-event-target';

class MyEvent extends UserEvent<'my'> {
  data: { x: number } = { x: 0 };
  constructor() {
    super('my');
  }
}

class MyEvent2 extends UserEvent<'my2'> {
  data: { y: number } = { y: 0 };
  constructor() {
    super('my2');
  }
}

const target = new EventTarget<[MyEvent,MyEvents]>();

target.addEventListener('my',(e)=>{

});

const event = new MyEvent();
target.dispatchEvent(event);
```

### API

```ts
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
export declare class Event<T> {
    constructor(type: T, options?: UserEventOptions);
    stopImmediatePropagation(): void;
    preventDefault(): void;
    get target(): any;
    get currentTarget(): any;
    get srcElement(): any;
    get type(): T;
    get cancelable(): boolean;
    get defaultPrevented(): boolean;
    get timeStamp(): number;
    get returnValue(): boolean;
    get bubbles(): boolean;
    get composed(): boolean;
    get eventPhase(): number;
    get cancelBubble(): boolean;
    set cancelBubble(value: boolean);
    stopPropagation(): void;
}
declare type ListenerFunction<EventType> = (event: EventType) => any;
declare type UserListener<EventType> = ListenerFunction<EventType> | {
    handleEvent: ListenerFunction<EventType>;
};
interface ListenerRoot<EventType> {
    size: number;
    next: ListenerNode<EventType> | undefined;
}
declare class ListenerNode<EventType> {
    next: ListenerNode<EventType> | undefined;
    previous: ListenerNode<EventType> | ListenerRoot<EventType> | undefined;
    listener: UserListener<EventType>;
    once?: boolean;
    capture?: boolean;
    passive?: boolean;
    callback: (event: EventType) => any;
    constructor(previous: ListenerNode<EventType> | ListenerRoot<EventType>, listener: UserListener<EventType>, once?: boolean, capture?: boolean, passive?: boolean);
    same(listener: UserListener<EventType>, capture: boolean): boolean;
    remove(): void;
}
declare type Unpacked<T> = T extends Array<infer U> ? U : T;
declare type ExtractEventType<EventUnion, K> = Extract<EventUnion, {
    type: K;
}>;
export declare class EventTarget<Events extends Array<Event<any>>, K extends Events[number]['type'] = Events[number]['type'], EventUnion extends Unpacked<Events> = Unpacked<Events>> {
    constructor();
    addEventListener<T extends K>(type: T, listener: UserListener<ExtractEventType<EventUnion, T>>, options?: UserListenerOptions): void;
    removeEventListener<T extends K>(type: T, listener: UserListener<ExtractEventType<EventUnion, T>>, options?: UserListenerOptions): void;
    dispatchEvent<T extends K>(event: ExtractEventType<EventUnion, T>): boolean;
    eventNames(): K[];
    listenerCount<T extends K>(type: T): number;
    removeAllEventListeners<T extends K>(type: T): this;
}
```