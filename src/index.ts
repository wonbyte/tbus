type Observer<TEvent extends IEvent> = (payload: TEvent) => void;

type ClassHandlerOrObserver<TEvent extends IEvent> = Observer<TEvent> | IEventHandler<TEvent>;

interface IEvent {
  // Elements of an IEvent object, accessed by the string index will be of any type.
  // Basically this weakens the type safety of the argument. This mechanism is of great use if the function is not
  // itself a consumer but a generic interlink between players using stronger typing
  [key: string]: any;
}

interface IEventHandler<TEvent extends IEvent> {
  handleEvent(payload: TEvent): void;
}

interface BusDefinition {
  [key: string]: IEvent;
}

interface MasterBusDefinition {
  [key: string]: IEventBus<any>;
}

interface IEventBus<Events extends BusDefinition> {
  /**
   * Subscribes a given handler or observer as a listener for events on the provided channel.
   * @param channel           The bus channel upon which to consume events
   * @param handlerOrObserver The handler or observer callback to consume events.
   */
  subscribe<K extends keyof Events>(
    channel: K,
    handlerOrObserver: ClassHandlerOrObserver<Events[K]>
  ): ClassHandlerOrObserver<Events[K]>;

  /**
   * Remove a given handler/observer from a given channel
   * @param channel           The bus channel from which to remove the observer.
   * @param handlerOrObserver The handler/observer callback to remove from the channel.
   */
  unsubscribe<K extends keyof Events>(channel: K, handlerOrObserver: ClassHandlerOrObserver<Events[K]>): void;

  /**
   * Emit an event with a given payload upon the provided channel.
   * @param channel The bus channel upon which to emit an event.
   * @param payload The payload to emit.
   */
  emit<K extends keyof Events>(channel: K, payload: Events[K]): void;
}

export interface IEventBusMaster<T extends MasterBusDefinition> {
  getBus<K extends keyof T>(busName: K): T[K];

  subscribe<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(
    busName: BusName,
    channel: EventName,
    handlerOrObserver: ClassHandlerOrObserver<BusEvents[EventName]>
  ): ClassHandlerOrObserver<BusEvents[EventName]>;
  unsubscribe<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(
    busName: BusName,
    channel: EventName,
    handlerOrObserver: ClassHandlerOrObserver<BusEvents[EventName]>
  ): void;
  emit<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(
    busName: BusName,
    channel: EventName,
    payload: BusEvents[EventName]
  ): void;
}

export function createEventBus<Events extends BusDefinition>() {
  const EventBus = (): IEventBus<Events> => {
    const listenerMap: Map<keyof Events, (Observer<IEvent> | IEventHandler<IEvent>)[]> = new Map();

    return {
      subscribe: <K extends keyof Events>(
        channel: K,
        handlerOrObserver: ClassHandlerOrObserver<Events[K]>
      ): ClassHandlerOrObserver<Events[K]> => {
        if (!listenerMap.has(channel)) {
          listenerMap.set(channel, [handlerOrObserver] as ClassHandlerOrObserver<IEvent>[]);
        } else {
          listenerMap.get(channel)!.push(handlerOrObserver as ClassHandlerOrObserver<IEvent>);
        }
        return handlerOrObserver;
      },
      unsubscribe: <K extends keyof Events>(
        channel: K,
        targetHandlerOrObserver: ClassHandlerOrObserver<Events[K]>
      ): void => {
        if (listenerMap.has(channel)) {
          const handlers = listenerMap.get(channel)!;
          const handlersWithoutTarget = handlers.filter(
            (handlerOrObserver) => handlerOrObserver !== targetHandlerOrObserver
          );
          listenerMap.set(channel, handlersWithoutTarget);
        }
      },
      emit<K extends keyof Events>(channel: K, payload: Events[K]): void {
        if (listenerMap.has(channel)) {
          const handlers = listenerMap.get(channel)!;
          handlers.forEach((handler) => {
            if (typeof handler === 'function') {
              handler(payload);
            } else {
              handler.handleEvent(payload);
            }
          });
        }
      },
    };
  };

  return EventBus();
}

export class EventBusMaster<T extends MasterBusDefinition> implements IEventBusMaster<T> {
  public constructor(private busMap: T) {}

  public getBus<K extends keyof T>(busName: K): T[K] {
    return this.busMap[busName];
  }

  subscribe<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(
    busName: BusName,
    channel: EventName,
    handler: ClassHandlerOrObserver<BusEvents[EventName]>
  ): ClassHandlerOrObserver<BusEvents[EventName]> {
    this.busMap[busName].subscribe(channel, handler);
    return handler;
  }
  unsubscribe<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(busName: BusName, channel: EventName, handler: ClassHandlerOrObserver<BusEvents[EventName]>): void {
    this.busMap[busName].unsubscribe(channel, handler);
  }
  emit<
    BusName extends keyof T,
    BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never,
    EventName extends keyof BusEvents
  >(busName: BusName, channel: EventName, payload: BusEvents[EventName]): void {
    this.busMap[busName].emit(channel as string, payload);
  }
}
