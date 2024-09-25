import React, { useEffect, useState } from "react"
import {
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"
import { storage } from "./firebaseConfig";
import { ref, uploadBytes } from "firebase/storage";
import { AudioRecorder as AudioRecorderVisualiser, useAudioRecorder } from '@theevann/react-audio-voice-recorder';
import { v4 as uuidv4 } from "uuid";

function BlobToDataURL(blob: Blob): Promise<string>{
  debugger;
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

async function getUserIP(): Promise<string> {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
}

function AudioRecorder(props: any) {
  const [isHoveredStart, setIsHoveredStart] = useState(false);
  const [isHoveredStop, setIsHoveredStop] = useState(false);

  const recorderControls = useAudioRecorder();

  const useAudioRecorderVisualiser = props.args.start_prompt === "" && props.args.stop_prompt === "";

  const onRecordingComplete = async (audioBlob: Blob) => {
    // const audioDataStr = (await BlobToDataURL(blob)).replace(/^data:.+?base64,/, "");
    // Streamlit.setComponentValue(audioDataStr);
    const userIP = await getUserIP();
    const storageRef = ref(storage, `audio/${userIP}_${uuidv4()}.wav`);

    try {
      // Upload the audio file to Firebase Storage
      await uploadBytes(storageRef, audioBlob);
      console.log("Uploaded a blob or file!");

      // Notify Streamlit that the recording is complete
      Streamlit.setComponentValue("Recording complete and uploaded to Firebase Storage");
    } catch (error) {
      console.error("Error uploading file to Firebase Storage:", error);
    }
  };

  useEffect(() => {
    // Component did mount
    Streamlit.setFrameHeight();

    // mimic componentDidUpdate if necessary
    const resizeListener = () => {
      Streamlit.setFrameHeight();
    };

    window.addEventListener('resize', resizeListener);

    // Component will unmount
    return () => { window.removeEventListener('resize', resizeListener); };
  }, []);

  useEffect(() => {
    if (!useAudioRecorderVisualiser && recorderControls.recordingBlob) {
      onRecordingComplete(recorderControls.recordingBlob);
    }
  }, [recorderControls.recordingBlob, useAudioRecorderVisualiser]);


  return !useAudioRecorderVisualiser ? (
    <span>
      <button
        onClick={() => {
          if (recorderControls.isRecording) {
            recorderControls.togglePauseResume();
          } else {
            recorderControls.startRecording();
          }
        }}
        disabled={props.disabled}
        className="btn btn-outline-secondary"
        style={{
          display: (!recorderControls.isRecording || props.args.pause_prompt !== "") ? "inline-block" : "none",
          marginBottom: "1px",
          marginRight: "10px",
          color: props.theme?.textColor,
          backgroundColor: isHoveredStart ? props.theme?.secondaryBackgroundColor : props.theme?.backgroundColor,
          borderColor: props.theme?.textColor,
          fontFamily: props.theme?.font,
        }}
        onMouseEnter={() => setIsHoveredStart(true)}
        onMouseLeave={() => setIsHoveredStart(false)}
      >
        {recorderControls.isRecording && !recorderControls.isPaused ? props.args.pause_prompt : props.args.start_prompt}
      </button>
      <button
        onClick={recorderControls.stopRecording}
        disabled={props.disabled || (!recorderControls.isRecording && !recorderControls.isPaused)}
        className="btn btn-outline-secondary"
        style={{
          display: (recorderControls.isRecording || recorderControls.isPaused) ? "inline-block" : "none",
          marginBottom: "1px",
          color: props.theme?.textColor,
          backgroundColor: isHoveredStop ? props.theme?.secondaryBackgroundColor : props.theme?.backgroundColor,
          borderColor: props.theme?.textColor,
          fontFamily: props.theme?.font,
        }}
        onMouseEnter={() => setIsHoveredStop(true)}
        onMouseLeave={() => setIsHoveredStop(false)}
      >
        {props.args.stop_prompt}
      </button>
    </span>
  ) : (
      <div style={{ padding: "5px" }}>
        <AudioRecorderVisualiser
          onRecordingComplete={onRecordingComplete}
          recorderControls={recorderControls}
          showVisualizer={props.args.show_visualizer}
        />
      </div>
  );
}

export default withStreamlitConnection(AudioRecorder);