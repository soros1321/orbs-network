import bind from "bind-decorator";

import { logger, config, topology, topologyPeers, grpc, types } from "../common-library";

export interface RPCMethodOptions {
  log: boolean;
}

export abstract class Service {
  public name: string;
  public nodeTopology: any;
  public peers: types.ClientMap;

  protected static RPCMethod(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>,
    silent: boolean = false): any {
    if (!descriptor || (typeof descriptor.value !== "function")) {
      throw new TypeError(`Only methods can be decorated with @RPCMethod. <${propertyKey}> is not a method!`);
    }

    if (!silent) {
      const originalMethod = descriptor.value;
      descriptor.value = function(rpc: any) {
        logger.debug(`${this.nodeTopology.name}: ${propertyKey} ${JSON.stringify(rpc.req)}`);

        return originalMethod.apply(this, [rpc]);
      };
    }

    return bind(target, propertyKey, descriptor);
  }

  protected static SilentRPCMethod(target: Object, propertyKey: string,
    descriptor: TypedPropertyDescriptor<Function>): any {
    return Service.RPCMethod(target, propertyKey, descriptor, true);
  }

  public constructor() {
    this.name = this.constructor.name;
    this.nodeTopology = topology();
    this.peers = topologyPeers(this.nodeTopology.peers);
  }

  abstract async initialize(): Promise<void>;

  public async start() {
    await this.initialize();

    logger.info(`${this.nodeTopology.name} (${this.name}): service started`);
  }

  public async stop() {
  }


}
