// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import path from "path";

import {
  IDataSourceFactory,
  DataSourceFactoryInitializeArgs,
} from "@foxglove/studio-base/context/PlayerSelectionContext";
import { IterablePlayer, WorkerIterableSource } from "@foxglove/studio-base/players/IterablePlayer";
import { Player } from "@foxglove/studio-base/players/types";

class RemoteDataSourceFactory implements IDataSourceFactory {
  public id = "remote-file";
  public type: IDataSourceFactory["type"] = "connection";
  public displayName = "Remote file";
  public iconName: IDataSourceFactory["iconName"] = "FileASPX";
  public supportedFileTypes = [".bag", ".mcap"];
  public description =
    "Fetch and load pre-recorded ROS 1 (.bag) or MCAP (.mcap) files from a remote location.";
  public docsLinks = [
    { label: "ROS 1", url: "https://foxglove.dev/docs/studio/connection/ros1#cloud-data" },
    { label: "MCAP", url: "https://foxglove.dev/docs/studio/connection/mcap#cloud-data" },
  ];

  public formConfig = {
    fields: [
      {
        id: "url",
        label: "Remote file URL",
        placeholder: "https://example.com/file.bag",
        validate: (newValue: string): Error | undefined => {
          try {
            const url = new URL(newValue);
            const extension = path.extname(url.pathname);

            if (extension.length === 0) {
              return new Error("URL must end with a filename and extension");
            }

            if (!this.supportedFileTypes.includes(extension)) {
              const supportedExtensions = new Intl.ListFormat("en-US", { style: "long" }).format(
                this.supportedFileTypes,
              );
              return new Error(`Only ${supportedExtensions} files are supported.`);
            }

            return undefined;
          } catch (err) {
            return new Error("Enter a valid url");
          }
        },
      },
    ],
  };

  public initialize(args: DataSourceFactoryInitializeArgs): Player | undefined {
    const url = args.params?.url;
    if (!url) {
      return;
    }

    const extension = path.extname(new URL(url).pathname);
    const sourceType = { ".bag": "rosbag", ".mcap": "mcap" }[extension] ?? "";
    const source = new WorkerIterableSource({ sourceType, initArgs: { url } });

    return new IterablePlayer({
      source,
      name: url,
      metricsCollector: args.metricsCollector,
      // Use blank url params so the data source is set in the url
      urlParams: { url },
      sourceId: this.id,
    });
  }
}

export default RemoteDataSourceFactory;
