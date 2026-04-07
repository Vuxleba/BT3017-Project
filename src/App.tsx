import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import fft from 'fourier-transform';
import './index.css';

interface WaveConfig {
  enabled: boolean;
  type: 'sine' | 'cosine';
  freq: number;
  amp: number;
}

interface DashboardState {
  fs: number;
  n: number;
  analysisPoint: number;
  wave1: WaveConfig;
  wave2: WaveConfig;
  wave3: WaveConfig;
}

const initialState: DashboardState = {
  fs: 50,
  n: 100,
  analysisPoint: 0.00,
  wave1: { enabled: true, type: 'sine', freq: 2, amp: 3 },
  wave2: { enabled: true, type: 'sine', freq: 4, amp: 1 },
  wave3: { enabled: false, type: 'cosine', freq: 5, amp: 2 }
};

function generateSignal(state: DashboardState) {
  const { fs, wave1, wave2, wave3 } = state;
  const duration = 10; // 10-second timeline

  // Continuous signal simulation (high resolution)
  const continuousFs = 500; // 500 Hz for smooth rendering
  const continuousData = [];
  for (let i = 0; i <= duration * continuousFs; i++) {
    const t = i / continuousFs;
    let y = 0;

    if (wave1.enabled) {
      y += wave1.type === 'sine' ? wave1.amp * Math.sin(2 * Math.PI * wave1.freq * t) : wave1.amp * Math.cos(2 * Math.PI * wave1.freq * t);
    }
    if (wave2.enabled) {
      y += wave2.type === 'sine' ? wave2.amp * Math.sin(2 * Math.PI * wave2.freq * t) : wave2.amp * Math.cos(2 * Math.PI * wave2.freq * t);
    }
    if (wave3.enabled) {
      y += wave3.type === 'sine' ? wave3.amp * Math.sin(2 * Math.PI * wave3.freq * t) : wave3.amp * Math.cos(2 * Math.PI * wave3.freq * t);
    }

    continuousData.push({ t, y });
  }

  // Discrete samples based on global fs
  const discreteData = [];
  for (let i = 0; i <= duration * fs; i++) {
    const t = i / fs;
    let y = 0;

    if (wave1.enabled) {
      y += wave1.type === 'sine' ? wave1.amp * Math.sin(2 * Math.PI * wave1.freq * t) : wave1.amp * Math.cos(2 * Math.PI * wave1.freq * t);
    }
    if (wave2.enabled) {
      y += wave2.type === 'sine' ? wave2.amp * Math.sin(2 * Math.PI * wave2.freq * t) : wave2.amp * Math.cos(2 * Math.PI * wave2.freq * t);
    }
    if (wave3.enabled) {
      y += wave3.type === 'sine' ? wave3.amp * Math.sin(2 * Math.PI * wave3.freq * t) : wave3.amp * Math.cos(2 * Math.PI * wave3.freq * t);
    }

    discreteData.push({ t, yDiscrete: y });
  }

  return { continuousData, discreteData };
}

export default function App() {
  const [state, setState] = useState<DashboardState>(initialState);

  const signalData = useMemo(() => generateSignal(state), [state]);

  const spectrumData = useMemo(() => {
    // Find the starting index for analysis
    let startIndex = -1;
    for (let i = 0; i < signalData.discreteData.length; i++) {
      if (signalData.discreteData[i].t >= state.analysisPoint) {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1 || startIndex + state.n > signalData.discreteData.length) {
      // Not enough data points
      return [];
    }

    const windowData = signalData.discreteData.slice(startIndex, startIndex + state.n);
    const windowValues = windowData.map(d => d.yDiscrete);

    // Apply Naive DFT instead of zero-padding for FFT to exactly match bin widths
    const N = state.n;
    const binWidth = state.fs / N;
    const result = [];

    // Calculate up to Nyquist limit (N/2)
    const numBins = Math.floor(N / 2);

    for (let k = 0; k < numBins; k++) {
      let sumReal = 0;
      let sumImag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        sumReal += windowValues[n] * Math.cos(angle);
        sumImag -= windowValues[n] * Math.sin(angle);
      }

      // Calculate magnitude and normalize
      // For real signals, magnitude at DC (k=0) and Nyquist is divided by N, others by N/2
      let magnitude = Math.sqrt(sumReal * sumReal + sumImag * sumImag) / N;
      if (k > 0) {
        magnitude *= 2;
      }

      const freq = k * binWidth;
      result.push({
        freq: freq,
        freqLabel: freq.toFixed(1),
        magnitude: magnitude
      });
    }

    return result;
  }, [signalData, state.analysisPoint, state.n, state.fs]);

  const windowDuration = state.n / state.fs;
  const binWidth = state.fs / state.n; // the theoretical one based on N, not padded N

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Short-Time Fourier Transform (STFT) Demonstration</h1>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Signal Synthesis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Zone 1: Signal Synthesis</h2>

          <div className="flex-grow flex flex-col gap-4">
            {/* Master Settings */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sampling Frequency (fs): {state.fs} Hz
                </label>
                <input
                  type="range" min="10" max="100" step="1"
                  value={state.fs}
                  onChange={(e) => setState({...state, fs: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Samples (N): {state.n}
                </label>
                <input
                  type="range" min="10" max="100" step="1"
                  value={state.n}
                  onChange={(e) => setState({...state, n: Number(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>

            {/* Wave Configurations */}
            {(['wave1', 'wave2', 'wave3'] as const).map((waveKey, idx) => {
              const wave = state[waveKey];
              return (
                <div key={waveKey} className={`p-3 rounded-md border ${wave.enabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={wave.enabled}
                        onChange={(e) => setState({ ...state, [waveKey]: { ...wave, enabled: e.target.checked } })}
                        className="mr-2"
                      />
                      Wave {idx + 1}
                    </label>
                    <select
                      value={wave.type}
                      onChange={(e) => setState({ ...state, [waveKey]: { ...wave, type: e.target.value as 'sine' | 'cosine' } })}
                      className="text-sm border-gray-300 rounded-md"
                      disabled={!wave.enabled}
                    >
                      <option value="sine">Sine</option>
                      <option value="cosine">Cosine</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500">Freq: {wave.freq} Hz</label>
                      <input
                        type="range" min="1" max="5" step="0.1"
                        value={wave.freq}
                        onChange={(e) => setState({ ...state, [waveKey]: { ...wave, freq: Number(e.target.value) } })}
                        className="w-full"
                        disabled={!wave.enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Amp: {wave.amp}</label>
                      <input
                        type="range" min="1" max="5" step="0.1"
                        value={wave.amp}
                        onChange={(e) => setState({ ...state, [waveKey]: { ...wave, amp: Number(e.target.value) } })}
                        className="w-full"
                        disabled={!wave.enabled}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-64 border border-gray-100 rounded-md p-2 relative bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickCount={11}
                  label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                  allowDataOverflow
                />
                <YAxis
                  domain={['auto', 'auto']}
                  label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip formatter={(val: any) => typeof val === 'number' ? val.toFixed(2) : val} labelFormatter={(val: any) => typeof val === 'number' ? `Time: ${val.toFixed(3)}s` : `Time: ${val}`} />
                <Line
                  data={signalData.continuousData}
                  type="monotone"
                  dataKey="y"
                  stroke="#8884d8"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Scatter
                  data={signalData.discreteData}
                  dataKey="yDiscrete"
                  fill="#82ca9d"
                  isAnimationActive={false}
                  line={false}
                />
                <ReferenceLine x={state.analysisPoint} stroke="red" strokeWidth={2} label="Analysis Point" />
                <ReferenceLine x={state.analysisPoint + state.n / state.fs} stroke="orange" strokeDasharray="3 3" label="Window End" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Spectrum Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Zone 2: Spectrum Analysis</h2>

          <div className="flex-grow flex flex-col gap-6">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <label className="block text-lg font-bold text-blue-900 mb-2">
                Current Time Analysis Point: {state.analysisPoint.toFixed(2)} s
              </label>
              <input
                type="range"
                min="0"
                max={Math.max(0, 10 - state.n / state.fs)}
                step="0.01"
                value={state.analysisPoint}
                onChange={(e) => setState({...state, analysisPoint: Number(e.target.value)})}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md text-center border border-gray-200">
                <span className="block text-sm text-gray-500 mb-1">Window Duration (s)</span>
                <span className="block text-xl font-semibold text-gray-800">{windowDuration.toFixed(3)}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-center border border-gray-200">
                <span className="block text-sm text-gray-500 mb-1">Frequency Bin Width (Hz)</span>
                <span className="block text-xl font-semibold text-gray-800">{binWidth.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="h-64 border border-gray-100 rounded-md p-2 relative bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spectrumData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="freqLabel"
                  label={{ value: 'Frequency (Hz)', position: 'insideBottomRight', offset: -5 }}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
                <YAxis
                  label={{ value: 'Magnitude', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax']}
                />
                <Tooltip
                  formatter={(val: any) => typeof val === 'number' ? val.toFixed(4) : val}
                  labelFormatter={(val: any) => `${val} Hz`}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="magnitude" fill="#3b82f6" isAnimationActive={false}>
                  {
                    spectrumData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
