# Azure Media Services Live Demo

How to orchestrate multiple live events via the command line.

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

NOTE: The script ./cli/index.js has been compiled from typescript with the following command:

~~~~pwsh
PS C:\> tsc .\cli\index.ts
~~~~

NOTE: In case you like to work directly with the typescript use the following command to compile and execute typescript on the fly:

~~~~pwsh
PS C:\> npx ts-node .\cli\index.ts --help
~~~~

### Create a fix pool of Live Events in StandBy State

NOTE: The max number is hard coded into the .\cli\index.ts and has the current value of 3

~~~~javascript
const maxStandbyLiveEvents: number = 3;
~~~~

~~~~pwsh
PS C:\> node .\cli\index.js in

Name                                    | State         | Prefix        | Token
81a407ef00974d199dc70ab68715fa1f        | StandBy       | user3         | e95539c2af08458185431c5bb9b1542f
18f274581fbf442b82fdc95eb4909233        | StandBy       | user1         | 1f84ad1473da4ca086e07d224abd0ccd
987a9c3b75c54b8cbc2fbed02c242351        | StandBy       | user2         | a09a61be39fd476e963b09ef16d29b04
~~~~

### Create my own UUID

Every User should always use the same Token and DNS Prefix, this will avoid to have to change settings inside Encoders like OBS.
Generate our own Token based on UUID spezification.

~~~~pwsh
PS C:\> node .\cli\index.js ts
df270a1cf9764683b9e37fda27969671
~~~~

### Assign one of the StandBy Live Events to our User

Our user will always use the same:

- DNS Prefix (cpt1)
- Token (df270a1cf9764683b9e37fda27969671)

~~~~pwsh
PS C:\> node .\cli\index.js as -n 81a407ef00974d199dc70ab68715fa1f -p cpt1 -t df270a1cf9764683b9e37fda27969671   
81a407ef00974d199dc70ab68715fa1f / cpt1 / df270a1cf9764683b9e37fda27969671
Start Live Event 81a407ef00974d199dc70ab68715fa1f operation... please stand by
Execution Live Event 81a407ef00974d199dc70ab68715fa1f: 11s 768.7675ms
Ingest url: rtmp://cpt1-ams02-euno.channel.media.azure.net:1935/live/df270a1cf9764683b9e37fda27969671
Preview url is: https://cpt1-ams02.preview-euno.channel.media.azure.net/e6ff5ea9-2e41-44d7-9455-54e682edbb6d/preview.ism/manifest
Preview via AMP: https://ampdemo.azureedge.net/?url=https://cpt1-ams02.preview-euno.channel.media.azure.net/e6ff5ea9-2e41-44d7-9455-54e682edbb6d/preview.ism/manifest(format=mpd-time-cmaf)&heuristicprofile=lowlatency
Current No of Standby LiveEvents: 2 Max Number: 3
Create Live Event 8d111217abfc4e6386a98d563a983ac2, execution time: 8s 28.6663ms
Allocate Live Event 8d111217abfc4e6386a98d563a983ac2, execution time : 6s 513.8418ms
Ingest URL : rtmp://user3-ams02-euno.channel.media.azure.net:1935/live/b2e21e9f40c84963bdcef9c5884568dd
Name                                    | State         | Prefix        | Token
81a407ef00974d199dc70ab68715fa1f        | Running       | cpt1          | df270a1cf9764683b9e37fda27969671
8d111217abfc4e6386a98d563a983ac2        | StandBy       | user3         | b2e21e9f40c84963bdcef9c5884568dd
18f274581fbf442b82fdc95eb4909233        | StandBy       | user1         | 1f84ad1473da4ca086e07d224abd0ccd
987a9c3b75c54b8cbc2fbed02c242351        | StandBy       | user2         | a09a61be39fd476e963b09ef16d29b04
~~~~

### Broadcast via OBS

Setup OBS with ingest URL
![Enter](/images/az.ams.live.001.png)
Start streaming via OBS
![Enter](/images/az.ams.live.002.png)
Test via Azure Media Player
Call https://ampdemo.azureedge.net/?url=https://cpt1-ams02.preview-euno.channel.media.azure.net/e6ff5ea9-2e41-44d7-9455-54e682edbb6d/preview.ism/manifest(format=mpd-time-cmaf)&heuristicprofile=lowlatency via your Browser
![Enter](/images/az.ams.live.003.png)

### Broadcast another Live Stream with a new Token

Create new Token:

~~~~pwsh
PS C:\> node .\cli\index.js ts
25a0400fdd694d5db47c53eddb81532e
~~~~

Our user will always use the same:

- DNS Prefix (cpt2)
- Token (25a0400fdd694d5db47c53eddb81532e)

~~~~pwsh
PS C:\> node .\cli\index.js as -n 8d111217abfc4e6386a98d563a983ac2 -p cpt2 -t 25a0400fdd694d5db47c53eddb81532e
8d111217abfc4e6386a98d563a983ac2 / cpt2 / 25a0400fdd694d5db47c53eddb81532e
Start Live Event 8d111217abfc4e6386a98d563a983ac2 operation... please stand by
Execution Live Event 8d111217abfc4e6386a98d563a983ac2: 11s 938.735ms
Ingest url: rtmp://cpt2-ams02-euno.channel.media.azure.net:1935/live/25a0400fdd694d5db47c53eddb81532e
Preview url is: https://cpt2-ams02.preview-euno.channel.media.azure.net/f5846922-23a2-4135-b36c-c1ddf2ecec30/preview.ism/manifest
Preview via AMP: https://ampdemo.azureedge.net/?url=https://cpt2-ams02.preview-euno.channel.media.azure.net/f5846922-23a2-4135-b36c-c1ddf2ecec30/preview.ism/manifest(format=mpd-time-cmaf)&heuristicprofile=lowlatency
Current No of Standby LiveEvents: 2 Max Number: 3
Create Live Event e229c78d469045de8395affe352d53e9, execution time: 8s 34.135601ms
Allocate Live Event e229c78d469045de8395affe352d53e9, execution time : 6s 456.0441ms
Ingest URL : rtmp://user3-ams02-euno.channel.media.azure.net:1935/live/9c6da2b13be34b549d72b14025de41fe
Name                                    | State         | Prefix        | Token
81a407ef00974d199dc70ab68715fa1f        | Running       | cpt1          | df270a1cf9764683b9e37fda27969671
e229c78d469045de8395affe352d53e9        | StandBy       | user3         | 9c6da2b13be34b549d72b14025de41fe
8d111217abfc4e6386a98d563a983ac2        | Running       | cpt2          | 25a0400fdd694d5db47c53eddb81532e
18f274581fbf442b82fdc95eb4909233        | StandBy       | user1         | 1f84ad1473da4ca086e07d224abd0ccd
987a9c3b75c54b8cbc2fbed02c242351        | StandBy       | user2         | a09a61be39fd476e963b09ef16d29b04
~~~~

### Broadcast via OBS

Setup OBS like mentioned above and aftewards call https://ampdemo.azureedge.net/?url=https://cpt1-ams02.preview-euno.channel.media.azure.net/e6ff5ea9-2e41-44d7-9455-54e682edbb6d/preview.ism/manifest(format=mpd-time-cmaf)&heuristicprofile=lowlatency via your Browser
![Enter](/images/az.ams.live.004.png)

### Clean Up to save cost

Delete LiveStream

~~~~pwsh
PS C:\> node .\cli\index.js de -a
Name                                    | State         | Prefix        | Token
~~~~

## NOTES

### Ingest URLs (endpoints)

A channel provides an input endpoint (ingest URL) that you specify in the live encoder, so the encoder can push streams to your channels.

You can get the ingest URLs when you create the channel. For you to get these URLs, the channel does not have to be in the Running state. When you're ready to start pushing data to the channel, the channel must be in the Running state. After the channel starts ingesting data, you can preview your stream through the preview URL.

You have an option of ingesting a fragmented MP4 (Smooth Streaming) live stream over a TLS connection. To ingest over TLS, make sure to update the ingest URL to HTTPS. Currently, you cannot ingest RTMP over TLS.

- (source: https://docs.microsoft.com/en-us/azure/media-services/previous/media-services-live-streaming-with-onprem-encoders#ingest-urls-endpoints)

Preview URLs
Currently, the preview stream can be delivered only in fragmented MP4 (Smooth Streaming) format, regardless of the specified input type. You can use the Smooth Streaming Health Monitor player to test the smooth stream. You can also use a player that's hosted in the Azure portal to view your stream.

- (source: https://docs.microsoft.com/en-us/azure/media-services/previous/media-services-live-streaming-with-onprem-encoders#channel-preview)

Every time you reconfigure the live encoder, call the Reset method on the channel. Before you reset the channel, you have to stop the program. After you reset the channel, restart the program.

Note: When you restart the program, you need to associate it with a new asset and create a new locator.

## Usefull Links

- ![Starting 2021 With the Latest and Greatest Features of Azure Video Indexer](https://techcommunity.microsoft.com/t5/azure-media-services/starting-2021-with-the-latest-and-greatest-features-of-azure/ba-p/2179152)
- ![Media Services pricing](https://azure.microsoft.com/en-us/pricing/details/media-services/)
- ![Stream-level events](https://docs.microsoft.com/en-us/azure/media-services/latest/monitoring/media-services-event-schemas#stream-level-events)