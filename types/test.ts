import { Event, EventTarget } from '../src/';

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

const target = new EventTarget<[MyEvent, MyEvent2]>();
{
  target.addEventListener('my', (
    e // $ExpectType MyEvent
  ) => {
  });
  target.addEventListener('my2', (
    e // $ExpectType MyEvent2
  ) => {
  });
}
