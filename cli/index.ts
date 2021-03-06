// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { AzureMediaServices } from '@azure/arm-mediaservices';
import { v4 as uuidv4 } from 'uuid';
import { v1 as uuidv1 } from 'uuid';
import {randomBytes as crypto} from 'crypto';
import { AzureMediaServicesOptions, IPRange, LiveEvent, LiveEventInputAccessControl, LiveEventPreview, LiveOutput, MediaservicesGetResponse } from "@azure/arm-mediaservices/esm/models";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

import { Command, exitOverride } from 'commander';
import { LiveEventPreviewAccessControl, SystemData } from "@azure/arm-mediaservices/esm/models/mappers";
import { systemErrorRetryPolicy } from "@azure/ms-rest-js";
const program = new Command();

// from your Media Services account's API Access page in the Azure portal.
const clientId: string = process.env.AADCLIENTID as string;
const secret: string = process.env.AADSECRET as string;
const tenantDomain: string = process.env.AADTENANTDOMAIN as string;
const subscriptionId: string = process.env.SUBSCRIPTIONID as string;
const resourceGroup: string = process.env.RESOURCEGROUP as string;
const accountName: string = process.env.ACCOUNTNAME as string;
const maxStandbyLiveEvents: number = 3;

export async function main() {

  const program = new Command()
    .name('amsCLI')
    .description('AMS CLI');

  program.command('init') // sub-command name
    .alias('in') // shortcut
    .description('Set max standby AMS Live Events') // command description
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      setMaxStandByLiveEvent();
    });

  program.command('list') // sub-command name
    .alias('ls') // alternative sub-command is `ls`
    .description('List AMS Live Events') // command description
    // function to execute when command is uses
    .action(function () {
      listLiveEvent();
    });

  program.command('state') // sub-command name
    .alias('st') // shortcut
    .description('Change State of exisitng AMS Live Events') // command description
    .option('-n ,--name <type>', 'Live Event Name')
    .option('-s ,--state <type>', 'State')
    .option('-a ,--all', 'Change the state of all Live Events')
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      console.log('%s %s', options.name, '/ ' + options.state, '/ ' + options.all);
      if (options.all) {
        setStateLiveEventAll(options.state);
      } else {
        setStateLiveEvent(options.name, options.state);
      }
    });

  program.command('create') // sub-command name
    .alias('cr') // shortcut
    .description('Create new AMS Live Events') // command description
    .option('-n ,--name <type>', 'Live Event Name')
    .option('-p ,--prefix <type>', 'Hostname Prefix')
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      console.log('%s %s', options.name, '/ ' + options.prefix);
      createLiveEvent(options.name, options.prefix);

    });

  program.command('delete') // sub-command name
    .alias('de') // shortcut
    .description('Delete AMS Live Events') // command description
    .option('-n ,--name <type>', 'Live Event Name')
    .option('-a ,--all', 'Change the state of all Live Events')
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      console.log('%s %s', options.name, options.all);
      if (options.all) {
        deleteLiveEventAll();
      } else {
        deleteLiveEvent(options.name);
      }
    });

  program.command('update') // sub-command name
    .alias('up') // alternative sub-command is `ls`
    .description('Update AMS Live Events') // command description
    .option('-n ,--name <type>', 'Live Event Name')
    .option('-p ,--prefix <type>', 'Hostname Prefix')
    .option('-t ,--token <type>', 'Access Token')
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      //console.log(options);
      //console.log('%s %s', cmdInstance.current, '/ '+ cmdInstance.new);
      console.log('%s %s %s', options.name, '/ ' + options.prefix, '/ ' + options.token);
      updateLiveEvent(options.name, options.prefix, options.token);
    });

    program.command('assign') // sub-command name
    .alias('as') // alternative sub-command is `ls`
    .description('Assign AMS Live Events to User') // command description
    .option('-n ,--name <type>', 'Live Event Name')
    .option('-p ,--prefix <type>', 'Hostname Prefix')
    .option('-t ,--token <type>', 'Access Token')
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      //console.log(options);
      //console.log('%s %s', cmdInstance.current, '/ '+ cmdInstance.new);
      console.log('%s %s %s', options.name, '/ ' + options.prefix, '/ ' + options.token);
      assignLiveEventStandby(options.name, options.prefix, options.token);
    });

    program.command('test') // sub-command name
    .alias('ts') // alternative sub-command is `ls`
    .description('Test') // command description
    // function to execute when command is uses
    .action(function (path: String, cmdInstance: Command) {
      let options = cmdInstance.opts();
      let p = path;
      test();
    });

  program.parse();
  //program.help();
  const options = program.opts();
  if (options.action == "list") { }
}

main().catch((err) => {
  console.error("Error running sample:", err.message);
});

async function listLiveEvent() {
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }

  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  const mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // List Live Events
  // var assets = await mediaClient.assets.list(resourceGroup, accountName);
  var liveEvents = await mediaClient.liveEvents.list(resourceGroup, accountName);
  console.log('Name\t\t\t\t\t| State\t\t| Prefix\t| Token')
  liveEvents.forEach(liveEvent => {
    console.log('%s %s %s %s', liveEvent.name + '\t|', liveEvent.resourceState + '\t|', liveEvent.hostnamePrefix + '\t\t|', liveEvent.input.accessToken);
    //console.log("LiveEvent:"+ liveEvent.name+"\tStatus:"+liveEvent.resourceState)
  });
  /*
      assets.forEach(asset => {
        console.log(JSON.stringify(asset));
      });
  */
  /*
  if (assets.odatanextLink) {
    console.log("There are more than 1000 assets in this account, use the assets.listNext() method to continue listing more assets if needed")
    console.log("For example:  assets = await mediaClient.assets.listNext(assets.odatanextLink)");
  }
  */
}

async function updateLiveEvent(liveEventName: string, liveEventPrefix: string, accessToken: string) {

  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // Retrieve LiveEvent which does match to our input parameter current:
  let liveEvent = await mediaClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  );

  // We cannot modify an LiveEvent in state Running
  if (liveEvent.resourceState == "Running") {
    console.info(`Need to stop running Live Event %s`, liveEventName);
    let timeStartStop = process.hrtime();
    let stopOperation = await mediaClient.liveEvents.beginStop(
      resourceGroup,
      accountName,
      liveEventName,
      {
        // It can be faster to delete all live outputs first, and then delete the live event. 
        // if you have additional workflows on the archive to run. Speeds things up!
        //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
      }
    );
    await stopOperation.pollUntilFinished();
    let timeEndStop = process.hrtime(timeStartStop);
    console.info(`Execution time to Stop Live Event %s: %ds %dms`, liveEventName, timeEndStop[0], timeEndStop[1] / 1000000);
  }

  // With the Channel stopped I should be able to update a few things as needed...
  liveEvent.input.accessToken = accessToken; //"0eebebb0-7ce8-42b7-954a-e3553e810379";
  // Assign the new live Event Name to the hostnamePrefix setting:
  liveEvent.hostnamePrefix = liveEventPrefix;
  // Calling update 
  let liveEventUpdateOperation = await mediaClient.liveEvents.beginUpdate(
    resourceGroup,
    accountName,
    liveEventName,
    liveEvent
  );
  let updateresponse = await liveEventUpdateOperation.pollUntilFinished();

  console.log(`Starting the Live Event operation... please stand by`);
  let timeStartStart = process.hrtime();
  // Start the Live Event - this will take some time...
  let liveEventStartOperation = await mediaClient.liveEvents.beginStart(
    resourceGroup,
    accountName,
    liveEventName
  );
  console.log(`Live Event Start - HTTP Response Status: ${liveEventStartOperation.getInitialResponse().status}`);
  //console.log(liveEventStartOperation.getInitialResponse().parsedBody);

  //console.log(`The Live Event is being allocated. If the service's hotpool is completely depleted in a region, this could delay here for up to 15-30 minutes while machines are allocated.`)
  //console.log(`If this is taking a very long time, wait for at least 30 minutes and check on the status. If the code times out, or is cancelled, be sure to clean up in the portal!`)

  // Poll until this long running operation has finished.
  let response = await liveEventStartOperation.pollUntilFinished();
  let timeEndStart = process.hrtime(timeStartStart);
  console.info(`Execution time for start Live Event %s: %ds %dms`, liveEventName, timeEndStart[0], timeEndStart[1] / 1000000);
  //console.log();

  // Refresh the liveEvent object's settings after starting it...
  liveEvent = await mediaClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  )

  // Get the RTMP ingest URL to configure in OBS Studio. 
  // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
  // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
  if (liveEvent.input?.endpoints) {
    let ingestUrl = liveEvent.input.endpoints[0].url;
    console.log(`Ingest url: ${ingestUrl}`);
    //console.log(`Make sure to enter a Stream Key into the OBS studio settings. It can be any value or you can repeat the accessToken used in the ingest URL path.`);
    //console.log();
  }

  if (liveEvent.preview?.endpoints) {
    // Use the previewEndpoint to preview and verify
    // that the input from the encoder is actually being received
    // The preview endpoint URL also support the addition of various format strings for HLS (format=m3u8-cmaf) and DASH (format=mpd-time-cmaf) for example.
    // The default manifest is Smooth. 
    let previewEndpoint = liveEvent.preview.endpoints[0].url;
    // console.log("Preview url is: " + previewEndpoint);
    console.log("Preview via AMP: " + `https://ampdemo.azureedge.net/?url=${previewEndpoint}(format=mpd-time-cmaf)&heuristicprofile=lowlatency`);
  }

  console.log("Start the live stream now, sending the input to the ingest url and verify that it is arriving with the preview url.");
  console.log("IMPORTANT TIP!: Make CERTAIN that the video is flowing to the Preview URL before continuing!");
  listLiveEvent();
  console.log();
}

async function assignLiveEventStandby(liveEventName: string, liveEventPrefix: string, accessToken: string) {

  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // Retrieve LiveEvent which does match to our input parameter current:
  let liveEvent = await mediaClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  );

  // We cannot modify an LiveEvent in state Running
  if (liveEvent.resourceState == "StandBy" || liveEvent.resourceState == "Allocating") {
    
    // With the Channel stopped I should be able to update a few things as needed...
    liveEvent.input.accessToken = accessToken; //"0eebebb0-7ce8-42b7-954a-e3553e810379";
    // Assign the new live Event Name to the hostnamePrefix setting:
    liveEvent.hostnamePrefix = liveEventPrefix;
    // Calling update 
    let liveEventUpdateOperation = await mediaClient.liveEvents.beginUpdate(
      resourceGroup,
      accountName,
      liveEventName,
      liveEvent
    );
    let updateresponse = await liveEventUpdateOperation.pollUntilFinished();

    console.log(`Start Live Event %s operation... please stand by`,liveEventName);
    let timeStartStart = process.hrtime();
    // Start the Live Event - this will take some time...
    let liveEventStartOperation = await mediaClient.liveEvents.beginStart(
      resourceGroup,
      accountName,
      liveEventName
    );
    // console.log(`Live Event Start - HTTP Response Status: ${liveEventStartOperation.getInitialResponse().status}`);
    // Poll until this long running operation has finished.
    let response = await liveEventStartOperation.pollUntilFinished();
    let timeEndStart = process.hrtime(timeStartStart);
    console.info(`Execution Live Event %s: %ds %dms`, liveEventName, timeEndStart[0], timeEndStart[1] / 1000000);

    // Refresh the liveEvent object's settings after starting it...
    liveEvent = await mediaClient.liveEvents.get(
      resourceGroup,
      accountName,
      liveEventName
    )
    if (liveEvent.input?.endpoints) {
      let ingestUrl = liveEvent.input.endpoints[0].url;
      console.log(`Ingest url: ${ingestUrl}`);
    }

    if (liveEvent.preview?.endpoints) {
      let previewEndpoint = liveEvent.preview.endpoints[0].url;
      console.log("Preview url is: " + previewEndpoint);
      console.log("Preview via AMP: " + `https://ampdemo.azureedge.net/?url=${previewEndpoint}(format=mpd-time-cmaf)&heuristicprofile=lowlatency`);
    }

    // console.log("Start the live stream now, sending the input to the ingest url and verify that it is arriving with the preview url.");
    // console.log("IMPORTANT TIP!: Make CERTAIN that the video is flowing to the Preview URL before continuing!");
  } else {
    console.info(`Live Event %s is not in state Standby, current State: %s`, liveEventName, liveEvent.resourceState);
  }
  await setMaxStandByLiveEvent();
  //await listLiveEvent();
  console.log();
}

async function deleteLiveEventAll() {
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  var liveEvents = await mediaClient.liveEvents.list(resourceGroup, accountName);
  liveEvents.forEach(liveEvent => {
    if (liveEvent.name != null) {
      deleteLiveEvent(liveEvent.name);
    }
  });
}

async function deleteLiveEvent(liveEventName: string) {
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaServicesClient = new AzureMediaServices(creds, subscriptionId, clientOptions);
  // Find the LiveEvent which does match to our input parameter current:
  let liveEvent = await mediaServicesClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  );
  console.log(`Starting the Live Event operation... please stand by`);
  let timeStart = process.hrtime();
  if (liveEvent.resourceState != "Stopping" && liveEvent.resourceState != "Stopped") {
    await setStateLiveEvent(liveEventName, "stop");
  }
  let deleteOperation = await mediaServicesClient.liveEvents.beginDeleteMethod(
    resourceGroup,
    accountName,
    liveEventName,
    {
      // It can be faster to delete all live outputs first, and then delete the live event. 
      // if you have additional workflows on the archive to run. Speeds things up!
      //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
    }
  );
  await deleteOperation.pollUntilFinished();
  let timeEnd = process.hrtime(timeStart);
  console.info(`Execution time to delete %s Live Event: %ds %dms`, liveEventName, timeEnd[0], timeEnd[1] / 1000000);
  console.log();
  await listLiveEvent();
  console.log();
}

async function setStateLiveEventAll(liveEventState: string) {
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaServicesClient = new AzureMediaServices(creds, subscriptionId, clientOptions);
  let liveEvents = await mediaServicesClient.liveEvents.list(resourceGroup, accountName);
  liveEvents.forEach(liveEvent => {
    if (liveEventState == "start") {
      if (liveEvent.resourceState != "Starting" && liveEvent.resourceState != "Running") {
        setStateLiveEvent(<string>liveEvent.name, liveEventState);
      }
    } else if (liveEventState == "stop") {
      if (liveEvent.resourceState != "Stopping" && liveEvent.resourceState != "Stopped") {
        setStateLiveEvent(<string>liveEvent.name, liveEventState);
      }
    } else if (liveEventState == "standby") {
      if (liveEvent.resourceState != "Allocating" && liveEvent.resourceState != "StandBy") {
        setStateLiveEvent(<string>liveEvent.name, liveEventState);
      }
    }
  });
}

async function setStateLiveEvent(liveEventName: string, liveEventState: string) {
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  let timeStart = process.hrtime();
  /*
  The resource state of the live event. See https://go.microsoft.com/fwlink/?linkid=2139012 for more information. 
  Possible values include: 'Stopped', 'Allocating', 'StandBy', 'Starting', 'Running', 'Stopping', 'Deleting' 
  */
  switch (liveEventState) {
    case "stop":
      let stopOperation = await mediaClient.liveEvents.beginStop(
        resourceGroup,
        accountName,
        liveEventName,
        {
          // It can be faster to delete all live outputs first, and then delete the live event. 
          // if you have additional workflows on the archive to run. Speeds things up!
          //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
        }
      );
      await stopOperation.pollUntilFinished();
      break;
    case "start":
      let startOperation = await mediaClient.liveEvents.beginStart(
        resourceGroup,
        accountName,
        liveEventName,
        {
          // It can be faster to delete all live outputs first, and then delete the live event. 
          // if you have additional workflows on the archive to run. Speeds things up!
          //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
        }
      );
      await startOperation.pollUntilFinished();
      break;
    case "standby":
      let stopOperation2 = await mediaClient.liveEvents.beginStop(
        resourceGroup,
        accountName,
        liveEventName,
        {
          // It can be faster to delete all live outputs first, and then delete the live event. 
          // if you have additional workflows on the archive to run. Speeds things up!
          //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
        }
      );
      await stopOperation2.pollUntilFinished();
      let standbyOperation = await mediaClient.liveEvents.beginAllocate(
        resourceGroup,
        accountName,
        liveEventName,
        {
          // It can be faster to delete all live outputs first, and then delete the live event. 
          // if you have additional workflows on the archive to run. Speeds things up!
          //removeOutputsOnStop :true // this is OPTIONAL, but recommend deleting them manually first. 
        }
      );
      await standbyOperation.pollUntilFinished();
      break;
    default:
      console.log(`Value %s for parameter state is not support by this command`, liveEventState);
      console.log(`Valid state values are start, stop, standby`);
  }
  let timeEnd = process.hrtime(timeStart);
  console.info(`Execution time  of %s to state %s : %ds %dms`, liveEventName, liveEventState, timeEnd[0], timeEnd[1] / 1000000);
  console.log();
  await listLiveEvent();
  console.log();
}

async function setMaxStandByLiveEvent() {
  //Init AzureMediaService Client
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }

  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  const mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // Count all Live Events in state standby
  let liveEvents = await mediaClient.liveEvents.list(resourceGroup, accountName);
  //let currentNumberofStandByLiveEvents: number = 0;
  let liveEventsStandByArry = [];
  liveEvents.forEach(liveEvent => {
    if (liveEvent.resourceState == "StandBy" || liveEvent.resourceState == "Allocating") {
      liveEventsStandByArry.push(liveEvent);
      //currentNumberofStandByLiveEvents++;
    }
  });
  console.log(`Current No of Standby LiveEvents: %s Max Number: %s`, liveEventsStandByArry.length, maxStandbyLiveEvents);
  //
  if (liveEventsStandByArry.length < maxStandbyLiveEvents) {
    let diffStandByLiveEvents = maxStandbyLiveEvents - liveEventsStandByArry.length;
    while(liveEventsStandByArry.length < maxStandbyLiveEvents){
      let numberlabel = liveEventsStandByArry.length + 1;
      // console.log(`numberlabel: %s`, numberlabel);
      // console.log(`create sbstream:` + numberlabel + ` user:` + numberlabel)
      //LiveEvent Name max length 32
      let newLiveEventStandBy:LiveEvent = await createLiveEventStandBy(uuidv4().replace(/-/g,''), `user` + numberlabel);
      liveEventsStandByArry.push(newLiveEventStandBy);
    }
  }
}

async function createLiveEventStandBy(liveEventName: string, liveEventPrefix: string) {
  // Create Access Token from Name
  let accessToken = uuidv4();
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // Get the media services account object for information on the current location. 
  let mediaAccount: MediaservicesGetResponse;
  mediaAccount = await mediaClient.mediaservices.get(resourceGroup, accountName);

  // Define LiveEvent Config Objects
  let allowAllInputRange: IPRange = {
    name: "AllowAll",
    address: "0.0.0.0",
    subnetPrefixLength: 0
  };
  // Create the LiveEvent input IP access control object
  // this will control the IP that the encoder is running on and restrict access to only that encoder IP range.
  let liveEventInputAccess: LiveEventInputAccessControl = {
    ip: {
      allow: [
        allowAllInputRange
      ]
    }
  };

  // Create the LiveEvent Preview IP access control object. 
  // This will restrict which clients can view the preview endpoint
  let liveEventPreview: LiveEventPreview = {
    accessControl: {
      ip: {
        allow: [
          allowAllInputRange
        ]
      }
    }
  }

  let liveEventCreate: LiveEvent = {
    location: mediaAccount.location,
    description: liveEventName,
    // Set useStaticHostname to true to make the ingest and preview URL host name the same. 
    // This can slow things down a bit. 
    useStaticHostname: true,
    hostnamePrefix: liveEventPrefix, /// When using Static host name true, you can control the host prefix name here if desired 
    // 1) Set up the input settings for the Live event...
    input: {
      streamingProtocol: "RTMP", // options are RTMP or Smooth Streaming ingest format.
      accessControl: liveEventInputAccess,  // controls the IP restriction for the source encoder. 
      accessToken: accessToken // Use this value when you want to make sure the ingest URL is static and always the same. If omitted, the service will generate a random GUID value.
    },

    // 2) Set the live event to use pass-through or cloud encoding modes...
    encoding: {
      encodingType: "None",
    },
    // 3) Set up the Preview endpoint for monitoring based on the settings above we already set. 
    preview: liveEventPreview,

    // 4) Set up more advanced options on the live event. Low Latency is the most common one. 
    streamOptions: [
      "LowLatency"
    ],

  }

  let timeStart = process.hrtime();
  let liveCreateOperation = await mediaClient.liveEvents.beginCreate(
    resourceGroup,
    accountName,
    liveEventName,
    liveEventCreate,
    {
      autoStart: false
    }
  );

  // Make sure that the Live event is created
  if (!liveCreateOperation.isFinished()) {
    await liveCreateOperation.pollUntilFinished();
  }
  let timeEnd = process.hrtime(timeStart);
  console.info(`Create Live Event %s, execution time: %ds %dms`,liveEventName, timeEnd[0], timeEnd[1] / 1000000);

  timeStart = process.hrtime();
  // Allocate the Live Event - this will take some time...
  let liveEventStandByOperation = await mediaClient.liveEvents.beginAllocate(
    resourceGroup,
    accountName,
    liveEventName
  );

  let response = await liveEventStandByOperation.pollUntilFinished();
  timeEnd = process.hrtime(timeStart);
  console.info(`Allocate Live Event %s, execution time : %ds %dms`, liveEventName, timeEnd[0], timeEnd[1] / 1000000);
  //console.log();

  // Refresh the liveEvent object's settings after starting it...
  let liveEvent = await mediaClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  )

  if (liveEvent.input?.endpoints) {
    let ingestUrl = liveEvent.input.endpoints[0].url;
    console.log(`Ingest URL : ${ingestUrl}`);
  }

  if (liveEvent.preview?.endpoints) {
    let previewEndpoint = liveEvent.preview.endpoints[0].url;
    //console.log("Preview url is: " + previewEndpoint);
    //console.log("Preview via AMP: " + `https://ampdemo.azureedge.net/?url=${previewEndpoint}(format=mpd-time-cmaf)&heuristicprofile=lowlatency`);
  }
  await listLiveEvent();
  console.log();
  return liveEvent;
}

async function createLiveEvent(liveEventName: string, liveEventPrefix: string) {
  // Create Access Token from Name
  let accessToken = uuidv4();
  // Retrieve an Azure Media Service instance
  let clientOptions: AzureMediaServicesOptions = {
    longRunningOperationRetryTimeout: 5 // set the timeout for retries to 5 seconds
  }
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(clientId, secret, tenantDomain);
  let mediaClient = new AzureMediaServices(creds, subscriptionId, clientOptions);

  // Get the media services account object for information on the current location. 
  let mediaAccount: MediaservicesGetResponse;
  mediaAccount = await mediaClient.mediaservices.get(resourceGroup, accountName);

  // Define LiveEvent Config Objects

  // Note: When creating a LiveEvent, you can specify allowed IP addresses in one of the following formats:                 
  //      IpV4 address with 4 numbers
  //      CIDR address range

  let allowAllInputRange: IPRange = {
    name: "AllowAll",
    address: "0.0.0.0",
    subnetPrefixLength: 0
  };
  // Create the LiveEvent input IP access control object
  // this will control the IP that the encoder is running on and restrict access to only that encoder IP range.
  let liveEventInputAccess: LiveEventInputAccessControl = {
    ip: {
      allow: [
        // re-use the same range here for the sample, but in production you can lock this
        // down to the ip range for your on-premises live encoder, laptop, or device that is sending
        // the live stream
        allowAllInputRange
      ]
    }
  };

  // Create the LiveEvent Preview IP access control object. 
  // This will restrict which clients can view the preview endpoint
  let liveEventPreview: LiveEventPreview = {
    accessControl: {
      ip: {
        allow: [
          // re-use the same range here for the sample, but in production you can lock this to the IPs of your 
          // devices that would be monitoring the live preview. 
          allowAllInputRange
        ]
      }
    }
  }

  let liveEventCreate: LiveEvent = {
    location: mediaAccount.location,
    description: liveEventName,
    // Set useStaticHostname to true to make the ingest and preview URL host name the same. 
    // This can slow things down a bit. 
    useStaticHostname: true,
    hostnamePrefix: liveEventPrefix, /// When using Static host name true, you can control the host prefix name here if desired 
    // 1) Set up the input settings for the Live event...
    input: {
      streamingProtocol: "RTMP", // options are RTMP or Smooth Streaming ingest format.
      accessControl: liveEventInputAccess,  // controls the IP restriction for the source encoder. 
      // keyFrameIntervalDuration: "PT2S",  // Set this to match the ingest encoder's settings. This should not be used for encoding channels  
      accessToken: accessToken // Use this value when you want to make sure the ingest URL is static and always the same. If omitted, the service will generate a random GUID value.
    },

    // 2) Set the live event to use pass-through or cloud encoding modes...
    encoding: {
      // Set this to Standard or Premium1080P to use the cloud live encoder.
      // See https://go.microsoft.com/fwlink/?linkid=2095101 for more information
      // Otherwise, leave as "None" to use pass-through mode
      encodingType: "None",
      // OPTIONS for encoding type you can use:
      // encodingType: "None", // also known as pass-through mode. 
      // encodingType: "Premium1080p",// premium 1080P live encoding with adaptive bitrate set
      // encodingType: "Standard",// standard 720P live encoding with adaptive bitrate set
      //
      // OPTIONS using live cloud encoding type:
      // keyFrameInterval: "PT2S", //If this value is not set for an encoding live event, the fragment duration defaults to 2 seconds. The value cannot be set for pass-through live events.
      // presetName: null, // only used for custom defined presets. 
      //stretchMode: "None" // can be used to determine stretch on encoder mode
    },
    // 3) Set up the Preview endpoint for monitoring based on the settings above we already set. 
    preview: liveEventPreview,

    // 4) Set up more advanced options on the live event. Low Latency is the most common one. 
    streamOptions: [
      "LowLatency"
    ],

    // 5) Optionally enable live transcriptions if desired. 
    // WARNING : This is extra cost ($$$), so please check pricing before enabling.
    /* transcriptions : [
        {
            inputTrackSelection: [], // chose which track to transcribe on the source input.
            // The value should be in BCP-47 format (e.g: 'en-US'). See https://go.microsoft.com/fwlink/?linkid=2133742
            language: "en-us", 
            outputTranscriptionTrack: {
                trackName : "English" // set the name you want to appear in the output manifest
            }
        }
    ]
    */
  }

  //console.log("Creating the LiveEvent, please be patient as this can take time to complete async.")
  //console.log("Live Event creation is an async operation in Azure and timing can depend on resources available.")
  //console.log();
  let timeStart = process.hrtime();
  // When autostart is set to true, the Live Event will be started after creation. 
  // That means, the billing starts as soon as the Live Event starts running. 
  // You must explicitly call Stop on the Live Event resource to halt further billing.
  // The following operation can sometimes take awhile. Be patient.
  // On optional workflow is to first call allocate() instead of create. 
  // https://docs.microsoft.com/en-us/rest/api/media/liveevents/allocate 
  // This allows you to allocate the resources and place the live event into a "Standby" mode until 
  // you are ready to transition to "Running". This is useful when you want to pool resources in a warm "Standby" state at a reduced cost.
  // The transition from Standby to "Running" is much faster than cold creation to "Running" using the autostart property.
  // Returns a long running operation polling object that can be used to poll until completion.
  let liveCreateOperation = await mediaClient.liveEvents.beginCreate(
    resourceGroup,
    accountName,
    liveEventName,
    liveEventCreate,
    // When autostart is set to true, you should "await" this method operation to complete. 
    // The Live Event will be started after creation. 
    // You may choose not to do this, but create the object, and then start it using the standby state to 
    // keep the resources "warm" and billing at a lower cost until you are ready to go live. 
    // That increases the speed of startup when you are ready to go live. 
    {
      autoStart: false
    }
  );

  //console.log(`Live Event Create : HTTP Response Status: ${liveCreateOperation.getInitialResponse().status}`);
  //console.log(liveCreateOperation.getInitialResponse().parsedBody);

  // Make sure that the Live event is created
  if (!liveCreateOperation.isFinished()) {
    await liveCreateOperation.pollUntilFinished();
  }
  let timeEnd = process.hrtime(timeStart);
  //console.info(`Live Event Create : long running operation complete!`)
  console.info(`Live Event Create : Execution time for create LiveEvent: %ds %dms`, timeEnd[0], timeEnd[1] / 1000000);
  //console.log();

  // Create an Asset for the LiveOutput to use. Think of this as the "tape" that will be recorded to. 
  // The asset entity points to a folder/container in your Azure Storage account. 
  /*
  console.log(`Creating an asset named: ${assetName}`);
  console.log();
  let asset = await mediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, assetName, {});
  */
  // Create the Live Output - think of this as the "tape recorder for the live event". 
  // Live outputs are optional, but are required if you want to archive the event to storage,
  // use the asset for on-demand playback later, or if you want to enable cloud DVR time-shifting.
  // We will use the asset created above for the "tape" to record to. 
  /*
  let manifestName: string = "output";
  console.log(`Creating a live output named: ${liveOutputName}`);
  console.log();
  */
  // See the REST API for details on each of the settings on Live Output
  // https://docs.microsoft.com/rest/api/media/liveoutputs/create

  /*
  timeStart = process.hrtime();
  let liveOutputCreate: LiveOutput;
  if (asset.name) {
      liveOutputCreate = {
          description: "Optional description when using more than one live output",
          assetName: asset.name,
          manifestName: manifestName, // The HLS and DASH manifest file name. This is recommended to set if you want a deterministic manifest path up front.
          archiveWindowLength: "PT1H", // sets a one hour time-shift DVR window. Uses ISO 8601 format string.
          hls: {
              fragmentsPerTsSegment: 1 // Advanced setting when using HLS TS output only.
          },
      }

      // Create and await the live output
      let liveOutputOperation = await mediaServicesClient.liveOutputs.beginCreate(
          resourceGroup,
          accountName,
          liveEventName,
          liveOutputName,
          liveOutputCreate);

      console.log(`Live Output Create - HTTP Response Status: ${liveOutputOperation.getInitialResponse().status}`);
      console.log(liveOutputOperation.getInitialResponse().parsedBody);
  }
  timeEnd = process.hrtime(timeStart);
  console.info(`Execution time for create Live Output: %ds %dms`, timeEnd[0], timeEnd[1] / 1000000);
  console.log();
  */
  //console.log(`Live Event Start: ... please stand by`);
  timeStart = process.hrtime();
  // Start the Live Event - this will take some time...
  let liveEventStartOperation = await mediaClient.liveEvents.beginStart(
    resourceGroup,
    accountName,
    liveEventName
  );

  //console.log(`Live Event Start: HTTP Response Status: ${liveEventStartOperation.getInitialResponse().status}`);
  //console.log(liveEventStartOperation.getInitialResponse().parsedBody);

  //console.log(`The Live Event is being allocated. If the service's hotpool is completely depleted in a region, this could delay here for up to 15-30 minutes while machines are allocated.`)
  //console.log(`If this is taking a very long time, wait for at least 30 minutes and check on the status. If the code times out, or is cancelled, be sure to clean up in the portal!`)
  // Poll until this long running operation has finished.
  let response = await liveEventStartOperation.pollUntilFinished();
  timeEnd = process.hrtime(timeStart);
  console.info(`Live Event Start: Execution time : %ds %dms`, timeEnd[0], timeEnd[1] / 1000000);
  //console.log();

  // Refresh the liveEvent object's settings after starting it...
  let liveEvent = await mediaClient.liveEvents.get(
    resourceGroup,
    accountName,
    liveEventName
  )

  // Get the RTMP ingest URL to configure in OBS Studio. 
  // The endpoints is a collection of RTMP primary and secondary, and RTMPS primary and secondary URLs. 
  // to get the primary secure RTMPS, it is usually going to be index 3, but you could add a  loop here to confirm...
  if (liveEvent.input?.endpoints) {
    let ingestUrl = liveEvent.input.endpoints[0].url;
    console.log(`Ingest URL : ${ingestUrl}`);
  }

  if (liveEvent.preview?.endpoints) {
    // Use the previewEndpoint to preview and verify
    // that the input from the encoder is actually being received
    // The preview endpoint URL also support the addition of various format strings for HLS (format=m3u8-cmaf) and DASH (format=mpd-time-cmaf) for example.
    // The default manifest is Smooth. 
    let previewEndpoint = liveEvent.preview.endpoints[0].url;
    console.log("Preview url is: " + previewEndpoint);
    console.log("Preview via AMP: " + `https://ampdemo.azureedge.net/?url=${previewEndpoint}(format=mpd-time-cmaf)&heuristicprofile=lowlatency`);
  }
  listLiveEvent();
  console.log();
}

async function test(){
  // Create Access Token from Name
  let accessToken = uuidv4();
  let i:number = 0;
  //let accessToken32 = await accessToken.replaceAll(`-`,``);
  //console.log(accessToken.replace(/-/g, m  => !i++ ? m : ''));
  console.log(accessToken.replace(/-/g,''));
  //console.log(accessToken32);
  //console.log(uuidv1());
  //console.log(crypto(16).toString("hex"));
}
