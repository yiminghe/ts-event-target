import { Event, EventTarget } from '../';

describe('EventTarget', () => {
  class MyEvent extends Event<'my'> {
    data: { x: number } = { x: 0 };
    constructor() {
      super('my');
    }
  }

  class MyEvent2 extends Event<'my2'> {
    data: { y: number } = { y: 0 };
    constructor() {
      super('my2');
    }
  }

  it('works for preventDefault', () => {
    const target = new EventTarget<[MyEvent, MyEvent2]>();
    {
      const event = new MyEvent();
      event.data = { x: 2 };
      let ret: number[] = [];
      const f1 = (e: MyEvent) => {
        ret.push(1);
        e.preventDefault();
      };
      target.addEventListener('my', f1);
      target.addEventListener('my', () => {
        ret.push(2);
      });
      const event2 = new MyEvent2();
      event2.data = { y: 2 };
      const ret2 = [];
      target.addEventListener('my2', (e) => {
        ret2.push(2);
        expect(e.data.y).toEqual(2);
      });
      let runAll = target.dispatchEvent(event);
      expect(ret).toEqual([1,2]);
      expect(runAll).toEqual(false);
      target.removeEventListener('my', f1);
      ret = [];
      runAll = target.dispatchEvent(event);
      expect(ret).toEqual([2]);
      expect(runAll).toEqual(false);
    }
    {
      const event = new MyEvent2();
      event.data = { y: 2 };
      let ret: number[] = [];
      target.addEventListener('my2', (e) => {
        ret.push(1);
        expect(e.data.y).toEqual(2);
      });
      target.addEventListener('my2', (e: MyEvent2) => {
        ret.push(2);
        e.stopImmediatePropagation();
      });
      target.addEventListener('my2', () => {
        ret.push(3);
      });
      let runAll = target.dispatchEvent(event);
      expect(ret).toEqual([1,2]);
      expect(runAll).toEqual(true);

      target.removeAllEventListeners('my2');
      ret = [];
      runAll = target.dispatchEvent(event);
      expect(ret).toEqual([]);
      expect(runAll).toEqual(true);
    }
    expect(target.eventNames()).toEqual(['my']);
  });
});