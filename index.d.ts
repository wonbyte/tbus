declare type Observer<TEvent extends IEvent> = (payload: TEvent) => void;
declare type ClassHandlerOrObserver<TEvent extends IEvent> = Observer<TEvent> | IEventHandler<TEvent>;
interface IEvent {
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
    subscribe<K extends keyof Events>(channel: K, handlerOrObserver: ClassHandlerOrObserver<Events[K]>): ClassHandlerOrObserver<Events[K]>;
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
    subscribe<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, handlerOrObserver: ClassHandlerOrObserver<BusEvents[EventName]>): ClassHandlerOrObserver<BusEvents[EventName]>;
    unsubscribe<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, handlerOrObserver: ClassHandlerOrObserver<BusEvents[EventName]>): void;
    emit<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, payload: BusEvents[EventName]): void;
}
export declare function createEventBus<Events extends BusDefinition>(): IEventBus<Events>;
export declare class EventBusMaster<T extends MasterBusDefinition> implements IEventBusMaster<T> {
    private busMap;
    constructor(busMap: T);
    getBus<K extends keyof T>(busName: K): T[K];
    subscribe<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, handler: ClassHandlerOrObserver<BusEvents[EventName]>): ClassHandlerOrObserver<BusEvents[EventName]>;
    unsubscribe<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, handler: ClassHandlerOrObserver<BusEvents[EventName]>): void;
    emit<BusName extends keyof T, BusEvents extends T[BusName] extends IEventBus<infer A> ? A : never, EventName extends keyof BusEvents>(busName: BusName, channel: EventName, payload: BusEvents[EventName]): void;
}
export {};
