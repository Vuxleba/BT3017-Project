import React, { useState, useMemo } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Cell } from 'recharts';
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
  wave1: WaveConfig;
  wave2: WaveConfig;
  wave3: WaveConfig;
}

const initialState: DashboardState = {
  fs: 50,
  n: 100,
  wave1: { enabled: true, type: 'sine', freq: 2, amp: 3 },
  wave2: { enabled: true, type: 'sine', freq: 4, amp: 1 },
  wave3: { enabled: false, type: 'cosine', freq: 5, amp: 2 }
};

function generateSignal(state: DashboardState) {
  const { fs, n, wave1, wave2, wave3 } = state;
  const duration = n / fs; // Strictly bound to [0, T]

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
  for (let i = 0; i < n; i++) {
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
    const windowValues = signalData.discreteData.map(d => d.yDiscrete);

    const N = state.n;
    const binWidth = state.fs / N;
    const result = [];

    // Calculate two-sided DFT.
    // We strictly want frequencies from -5 Hz to +5 Hz.
    const maxFreq = 5;
    const maxK = Math.floor(maxFreq / binWidth);

    // Iterate from -maxK to +maxK
    for (let k = -maxK; k <= maxK; k++) {
      let sumReal = 0;
      let sumImag = 0;

      for (let n = 0; n < N; n++) {
        // angle for two-sided DFT
        const angle = (2 * Math.PI * k * n) / N;
        sumReal += windowValues[n] * Math.cos(angle);
        sumImag -= windowValues[n] * Math.sin(angle); // Standard DFT uses -j*angle
      }

      // Calculate two-sided magnitude and normalize by exactly 1/N.
      // This results in a peak of A/2 for a sinusoid of amplitude A.
      let magnitude = Math.sqrt(sumReal * sumReal + sumImag * sumImag) / N;

      const freq = k * binWidth;
      result.push({
        freq: freq,
        freqLabel: freq.toFixed(1),
        magnitude: magnitude
      });
    }

    return result;
  }, [signalData, state.n, state.fs]);

  const windowDuration = state.n / state.fs;
  const binWidth = state.fs / state.n; // the theoretical one based on N, not padded N

  const handleGlobalChange = (updates: Partial<DashboardState>) => {
    setState({ ...state, ...updates });
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Discrete Fourier Transform Demonstration</h1>

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
                  onChange={(e) => handleGlobalChange({fs: Number(e.target.value)})}
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
                  onChange={(e) => handleGlobalChange({n: Number(e.target.value)})}
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
                        type="range" min="1" max="5" step="1"
                        value={wave.freq}
                        onChange={(e) => setState({ ...state, [waveKey]: { ...wave, freq: Number(e.target.value) } })}
                        className="w-full"
                        disabled={!wave.enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Amp: {wave.amp}</label>
                      <input
                        type="range" min="1" max="5" step="1"
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
                  domain={[0, windowDuration]}
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Spectrum Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Zone 2: Spectrum Analysis</h2>

          <div className="flex-grow flex flex-col gap-6">
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
              <ComposedChart data={spectrumData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="freq"
                  type="number"
                  domain={[-5, 5]}
                  ticks={spectrumData.map(d => d.freq)}
                  tickFormatter={(val) => val.toFixed(1)}
                  label={{ value: 'Frequency (Hz)', position: 'insideBottomRight', offset: -5 }}
                  allowDataOverflow
                />
                <YAxis
                  label={{ value: 'Magnitude', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax']}
                  tickFormatter={(val) => val.toFixed(1)}
                />
                <Tooltip
                  formatter={(val: any) => typeof val === 'number' ? val.toFixed(4) : val}
                  labelFormatter={(val: any) => typeof val === 'number' ? `${val.toFixed(1)} Hz` : `${val} Hz`}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="magnitude" fill="#3b82f6" barSize={4} isAnimationActive={false}>
                  {
                    spectrumData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" />
                    ))
                  }
                </Bar>
                <Scatter dataKey="magnitude" fill="#1d4ed8" isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
