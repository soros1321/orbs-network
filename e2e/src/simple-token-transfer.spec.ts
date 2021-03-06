import { OrbsClientSession, OrbsHardCodedContractAdapter } from "./orbs-client";
import { FooBarAccount } from "./foobar-contract";
import { TextMessageAccount } from "./text-message-contract";
import { loadDefaultTestConfig } from "./test-config";
import * as chai from "chai";
import ChaiBarsPlugin from "./chai-bars-plugin";
import * as _ from "lodash";

const expect = chai.expect;

chai.should();
chai.use(ChaiBarsPlugin);

const testConfig = loadDefaultTestConfig();


async function aFooBarAccountWith(input: { amountOfBars: number }) {
  const senderAddress = `addr_${Math.floor(Math.random() * 100000000)}`; // TODO: replace with a proper public key
  const orbsSession = new OrbsClientSession(senderAddress, testConfig.subscriptionKey, testConfig.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "foobar");
  const account = new FooBarAccount(senderAddress, contractAdapter);

  await account.initBalance(input.amountOfBars);

  return account;
}

async function aTextMessageAccount() {
  const senderAddress = `addr_${Math.floor(Math.random() * 100000000)}`; // TODO: replace with a proper public key
  const orbsSession = new OrbsClientSession(senderAddress, testConfig.subscriptionKey, testConfig.publicApiClient);
  const contractAdapter = new OrbsHardCodedContractAdapter(orbsSession, "text-message");
  const account = new TextMessageAccount(senderAddress, contractAdapter);

  return account;
}

describe("simple token transfer", async function () {
  this.timeout(800000);
  before(async function () {
    if (testConfig.testEnvironment) {
      console.log("starting test environment...");
      await testConfig.testEnvironment.start();
    }
  });

  it("transfers 1 bar token from one account to another", async function () {
    console.log("initing account1 with 2 bars");
    const account1 = await aFooBarAccountWith({ amountOfBars: 2 });
    await account1.should.have.bars(2);
    console.log("initing account2 with 0 bars");
    const account2 = await aFooBarAccountWith({ amountOfBars: 0 });
    await account2.should.have.bars(0);

    console.log("sending 1 bar from account1 to account2");
    await account1.transfer({ to: account2.address, amountOfBars: 1 });
    await account1.should.to.have.bars(1);
    await account2.should.have.bars(1);

  });

  it("sends text messages between accounts", async function () {
    console.log("Initiating account for Alice");
    const alice = await aTextMessageAccount();

    console.log("Initiating account for Bob");
    const bob = await aTextMessageAccount();

    console.log("Sending messages from Alice to Bob and from Bob to Alice");

    await Promise.all([
      alice.sendMessage(bob.address, "hello"),
      alice.sendMessage(bob.address, "sup"),
      bob.sendMessage(alice.address, "is anybody in here?")
    ]);

    const [ bobMessages, aliceMessages ] = await Promise.all([bob.getMyMessages(), alice.getMyMessages()]);
    const [ bobMessage1, bobMessage2 ] = _.sortBy(bobMessages, "timestamp");

    expect(bobMessages.length).to.equal(2);
    expect(bobMessage1.message).to.equal("hello");
    expect(bobMessage2.message).to.equal("sup");

    expect(aliceMessages.length).to.equal(1);
    expect(aliceMessages[0].message).to.equal("is anybody in here?");
  });

  after(async function () {
    if (testConfig.testEnvironment) {
      await testConfig.testEnvironment.stop();
    }
  });
});
