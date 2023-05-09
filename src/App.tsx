import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import cv, { theRNG } from "@techstark/opencv-js";

import "./App.css";
import { processImage } from "./imageProcessing";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const videoConstraints: any = {
  aspectRatio: 1,
  height: 1440,
  width: 1440,
  facingMode: "environment", 
  // focusMode: "manual",  
  // focusDistance: 1,
  zoom: 2,
  // whiteBalanceMode: "manual" 
};

function App() {
  const webcamRef: any = React.useRef(null);
  const imgRef: any = React.useRef(null);
  const inRef: any = React.useRef(null);
  const [detectedPixels, setDetectedPixels] = useState(0);
  let [torchonoff,setTorch] = useState(false);
  let [histdata, setHistdata] = useState([]);
  let tiempo_anterior = 0;
  let lastimage: any = React.useRef(null);
  let  configuration_enabled=false;
  
  let gEmpty = [];
  for (var i = 1; i <= 100; i++) {
    gEmpty.push(0);
  }
  let [Gdata, setGdata] = useState(gEmpty);

  
  
  useEffect(() => {
    const process = async () => {
      const imageSrc = webcamRef?.current?.getScreenshot();
      if (webcamRef?.current?.stream!==undefined && imgRef?.current){
        let track = webcamRef?.current?.stream.getVideoTracks()[0];
        const capa = track.getCapabilities();
        const settings = track.getSettings();  
        console.log(capa);
        console.log(settings);
        if (!('zoom' in settings)) {
          return Promise.reject('Zoom is not supported by ' + track.label);
        }
        track.applyConstraints({
          advanced: [
            {torch: torchonoff},
          ]
        });
      }
      if (webcamRef?.current?.stream!==undefined && imgRef?.current ) {
        
        if( ! configuration_enabled){
          configuration_enabled=true;
          console.log("entro a configuracion video");
          let track = webcamRef?.current?.stream.getVideoTracks()[0];
          const capa = track.getCapabilities();
          const settings = track.getSettings();  
          console.log(capa);
          console.log(settings);
          if (!('zoom' in settings)) {
            return Promise.reject('Zoom is not supported by ' + track.label);
          }
          if (!('torch' in settings)) {
            return Promise.reject('Torch is not supported by ' + track.label);
          }
          track.applyConstraints({
            advanced: [
              { torch: torchonoff }
            ]
          });
        }
       

        if (!imageSrc) return;
        //debugger;
        return new Promise((resolve: any, reject: any) => {
            imgRef.current.src = imageSrc;
            imgRef.current.onload = () => {
                //console.log('La imagen de la webcam se ha cargado correctamente');
              try {
                const proccessedData = processImage(cv.imread(imgRef.current));
                if (torchonoff) {
                  setDetectedPixels(proccessedData.detectedPixels);
                  // setHistdata(proccessedData.histogram);
                  
                  if (Gdata.length<100)
                    Gdata.push(detectedPixels); 
                  else
                    setGdata([]);
    
                  
                  cv.imshow(inRef.current, proccessedData.image);
                } else {
                  cv.imshow(inRef.current, proccessedData.croppedImage);
                }
                resolve();
                } catch (error: unknown) {
                  if (error instanceof Error) {
                    console.error(error);
                    // hacer algo con el objeto de error
                    // let myBuffer = new ArrayBuffer(0);
                    resolve();
                  } else {
                    console.error("Error desconocido:", error);
                    // hacer algo con el valor desconocido
                    reject();
                  }
              }
            };
          
        });
      }
    }

    let handle: any;
    const nextTick = () => {
      handle = requestAnimationFrame(async () => {
        await process();
        nextTick();
      });
    };
    nextTick();

    return () => {
      cancelAnimationFrame(handle);
    };

  });

  const onloadWebCam=()=>{
    debugger;
  };

  // Torch on off
  const turnTorch = () => {
    setTorch((torchonoff) => !torchonoff);
  }

  const options = {
    responsive: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        // text: 'Chart.js Line Chart',
      },
      scales: {
        yAxes: [{
            display: true,
            ticks: {
                suggestedMax: 100,    // minimum will be 0, unless there is a lower value.
                // OR //
                beginAtZero: true   // minimum value will be 0.
            }
        }]
      }
    },
  };

  const labels = [];

  for (var i = 1; i <= 100; i++) {
    labels.push(i);
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Intensidad media del canal verde',
        data: Gdata,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <div className="App">
      <div className="camera">
        <Webcam
          ref={webcamRef}
          className="webcam"
          onLoad={onloadWebCam}
          imageSmoothing={false}
          screenshotFormat="image/jpeg"
          style={{ position: "absolute", opacity: 0, width: 200, height: 200 }}
          videoConstraints={videoConstraints}
          audio={false}
          screenshotQuality={1}
        />
        <img
          className="inputImage"
          alt="input"
          ref={imgRef}
          style={{ opacity: 0, position: "absolute", top: 0, left: 0 }}
        />
        <canvas
          ref={inRef}
          style={{
            width: 300,
            height: 300,
          }}
        />
        {/* <canvas
          ref={outRef}
          style={{
            width: 200,
            height: 200,
          }}
        /> */}
      </div>
      <div style={{ alignContent: "center", width: "100%", marginTop: 20 }}>
        <span> Green channel mean intensity: {detectedPixels}</span>
        <br />
        <br /> 
        <button onClick={turnTorch}>LED ON/OFF</button>
        <Line options={options} data={data} />
      </div>
    </div>
  );
}

export default App;
