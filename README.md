# Azure Media Services Live Demo

## Install

based on ![Azure Media Services v3 Node samples](https://github.com/Azure-Samples/media-services-v3-node-tutorials)

Clone from github

~~~~pwsh
PS C:\> git clone https://github.com/cpinotossi/az-ams-live.git
~~~~

Install Node Modules

~~~~pwsh
PS C:\> npm install
~~~~

## CLI 

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts --help
~~~~

List LiveStreams

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts ls
~~~~

Create LiveStream

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts create -n stream001 -p userX
~~~~

Delete LiveStream

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts delete -n cpthome
~~~~

Change State

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts state -n cpthome -s start
~~~~

Update LiveStream

~~~~pwsh
PS C:\>  npx ts-node .\cli\index.ts update -n cpthome -p user1 -t 0eebebb07ce842b7954ae3553e810301
~~~~

## NOTES

### Ingest URLs (endpoints)

A channel provides an input endpoint (ingest URL) that you specify in the live encoder, so the encoder can push streams to your channels.

You can get the ingest URLs when you create the channel. For you to get these URLs, the channel does not have to be in the Running state. When you're ready to start pushing data to the channel, the channel must be in the Running state. After the channel starts ingesting data, you can preview your stream through the preview URL.

You have an option of ingesting a fragmented MP4 (Smooth Streaming) live stream over a TLS connection. To ingest over TLS, make sure to update the ingest URL to HTTPS. Currently, you cannot ingest RTMP over TLS.
(source: https://docs.microsoft.com/en-us/azure/media-services/previous/media-services-live-streaming-with-onprem-encoders#ingest-urls-endpoints)

Preview URLs
Currently, the preview stream can be delivered only in fragmented MP4 (Smooth Streaming) format, regardless of the specified input type. You can use the Smooth Streaming Health Monitor player to test the smooth stream. You can also use a player that's hosted in the Azure portal to view your stream.
(source: https://docs.microsoft.com/en-us/azure/media-services/previous/media-services-live-streaming-with-onprem-encoders#channel-preview)

Every time you reconfigure the live encoder, call the Reset method on the channel. Before you reset the channel, you have to stop the program. After you reset the channel, restart the program.

Note: When you restart the program, you need to associate it with a new asset and create a new locator.

## Usefull Links

- ![Starting 2021 With the Latest and Greatest Features of Azure Video Indexer](https://techcommunity.microsoft.com/t5/azure-media-services/starting-2021-with-the-latest-and-greatest-features-of-azure/ba-p/2179152)
- ![Media Services pricing](https://azure.microsoft.com/en-us/pricing/details/media-services/)
- ![Stream-level events](https://docs.microsoft.com/en-us/azure/media-services/latest/monitoring/media-services-event-schemas#stream-level-events)