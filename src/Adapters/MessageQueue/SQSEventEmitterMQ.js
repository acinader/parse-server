import events from 'events';
import logger from '../../logger'

const emitter = new events.EventEmitter();
const subscriptions = new Map();

function unsubscribe(channel: string) {
  if (!subscriptions.has(channel)) {
    logger.debug('No channel to unsub from');
    return;
  }
  logger.debug('unsub ', channel);
  emitter.removeListener(channel, subscriptions.get(channel));
  subscriptions.delete(channel);
}

class Publisher {
  emitter: any;

  constructor(emitter: any) {
    this.emitter = emitter;
  }

  publish(channel: string, message: string): void {
    this.emitter.emit(channel, message);
  }
}

class Consumer extends events.EventEmitter {
  emitter: any;

  constructor(emitter: any) {
    // eslint-disable-next-line
    console.log('greetings from sqseemq');
    super();
    this.emitter = emitter;
  }

  subscribe(channel: string): void {
    unsubscribe(channel);
    const handler = (message) => {
      this.emit('message', channel, message);
    }
    subscriptions.set(channel, handler);
    this.emitter.on(channel, handler);
  }

  unsubscribe(channel: string): void {
    unsubscribe(channel);
  }
}

function createPublisher(): any {
  return new Publisher(emitter);
}

function createSubscriber(): any {
  return new Consumer(emitter);
}

const SQSEventEmitterMQ = {
  createPublisher,
  createSubscriber
}

export {
  SQSEventEmitterMQ
}
