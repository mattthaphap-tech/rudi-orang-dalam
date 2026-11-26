import React from "react";
import { Composition, Folder } from "remotion";
import {
  DemoShort,
  DemoShortWithCaptions,
  DemoFrames,
} from "./videos/demo/Bridge";
import { DemoCaptionOverlay } from "./videos/demo/DemoCaptionOverlay";
import { DemoCaptionsOnly } from "./videos/demo/CaptionsOnly";
import { DartoShort, DartoShortWithCaptions, DartoFrames } from "./videos/darto/Bridge";
import { DartoCaptionOverlay } from "./videos/darto/DartoCaptionOverlay";
import { DartoCaptionsOnly } from "./videos/darto/CaptionsOnly";
import { OrangDalamVideo } from "./videos/orang-dalam/Bridge";

export const Root: React.FC = () => {
  return (
    <>
      <Folder name="Demo">
        <Composition
          id="DemoShort"
          component={DemoShort}
          durationInFrames={DemoFrames}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="DemoShortWithCaptions"
          component={DemoShortWithCaptions}
          durationInFrames={DemoFrames}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="DemoCaptionOverlay"
          component={DemoCaptionOverlay}
          durationInFrames={DemoFrames}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="DemoCaptionGreenScreen"
          component={() => <DemoCaptionOverlay bg="#00FF00" />}
          durationInFrames={DemoFrames}
          fps={30}
          width={1080}
          height={1920}
        />
        <Composition
          id="DemoCaptions"
          component={DemoCaptionsOnly}
          durationInFrames={DemoFrames}
          fps={30}
          width={1080}
          height={1920}
        />
      </Folder>
      <Folder name="Darto">
        <Composition id="DartoShort" component={DartoShort} durationInFrames={DartoFrames} fps={30} width={1080} height={1920} />
        <Composition id="DartoShortWithCaptions" component={DartoShortWithCaptions} durationInFrames={DartoFrames} fps={30} width={1080} height={1920} />
        <Composition id="DartoCaptionOverlay" component={DartoCaptionOverlay} durationInFrames={DartoFrames} fps={30} width={1080} height={1920} />
        <Composition id="DartoCaptionGreenScreen" component={() => <DartoCaptionOverlay bg="#00FF00" />} durationInFrames={DartoFrames} fps={30} width={1080} height={1920} />
        <Composition id="DartoCaptions" component={DartoCaptionsOnly} durationInFrames={DartoFrames} fps={30} width={1080} height={1920} />
      </Folder>
      <Folder name="OrangDalam">
        <Composition id="OrangDalam" component={OrangDalamVideo} durationInFrames={2655} fps={30} width={1080} height={1920} />
      </Folder>
    </>
  );
};
