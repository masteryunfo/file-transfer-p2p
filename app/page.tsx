'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Smartphone, Monitor, Wifi, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function FileTransferApp() {
  const [mode, setMode] = useState<'computer' | 'phone' | null>(null);

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <Wifi className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Quick Transfer</h1>
            <p className="text-gray-600">Transfer files directly via WiFi</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('computer')}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              <Monitor className="w-6 h-6" />
              <span>Receive on Computer</span>
            </button>

            <button
              onClick={() => setMode('phone')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-4 px-6 rounded-xl border-2 border-indigo-600 transition-colors"
            >
              <Smartphone className="w-6 h-6" />
              <span>Send from Phone</span>
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              🔒 <strong>Private & Secure:</strong> Files transfer directly between devices. Nothing stored in cloud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return mode === 'computer' ? <ComputerView onBack={() => setMode(null)} /> : <PhoneView onBack={() => setMode(null)} />;
}

function ComputerView({ onBack }: { onBack: () => void }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [status, setStatus] = useState<'initializing' | 'waiting' | 'connected' | 'receiving' | 'complete'>('initializing');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [expiryTime, setExpiryTime] = useState(300);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const chunksRef = useRef<ArrayBuffer[]>([]);
  const totalSizeRef = useRef(0);
  const receivedSizeRef = useRef(0);

  useEffect(() => {
    createRoom();
    const timer = setInterval(() => {
      setExpiryTime(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const createRoom = async () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    setStatus('waiting');
    
    setupWebRTC(id);
  };

  const setupWebRTC = async (id: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      setStatus('connected');

      channel.onmessage = (e) => {
        if (typeof e.data === 'string') {
          const meta = JSON.parse(e.data);
          setFileName(meta.name);
          totalSizeRef.current = meta.size;
          setStatus('receiving');
        } else {
          chunksRef.current.push(e.data);
          receivedSizeRef.current += e.data.byteLength;
          setProgress(Math.round((receivedSizeRef.current / totalSizeRef.current) * 100));
        }
      };

      channel.onclose = () => {
        const blob = new Blob(chunksRef.current);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'received-file';
        a.click();
        URL.revokeObjectURL(url);
        setStatus('complete');
      };
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await fetch(`/api/signaling/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'offer', data: offer })
    });

    pollForAnswer(id, pc);
  };

  const pollForAnswer = async (id: string, pc: RTCPeerConnection) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/signaling/poll/${id}`);
        if (!res.ok) return;
        
        const data = await res.json();
        if (data.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          clearInterval(interval);
        }
        if (data.ice && data.ice.length > 0) {
          for (const candidate of data.ice) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    setTimeout(() => clearInterval(interval), 300000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800 mb-4">← Back</button>
        
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-full mb-4 ${
            status === 'complete' ? 'bg-green-100' : 'bg-indigo-100'
          }`}>
            {status === 'complete' ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <Monitor className="w-12 h-12 text-indigo-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Receive File</h2>
        </div>

        {roomId && status === 'waiting' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Your pairing code:</p>
              <div className="text-5xl font-mono font-bold text-indigo-600 tracking-widest mb-6">
                {roomId}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Waiting for phone to connect...</span>
            </div>

            <div className="text-center text-sm text-gray-500">
              ⏱ Expires in {formatTime(expiryTime)}
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Connected!</span>
            </div>
            <p className="text-gray-600">Ready to receive file...</p>
          </div>
        )}

        {status === 'receiving' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Receiving:</p>
              <p className="font-semibold text-gray-800 mb-4">{fileName}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-2xl font-bold text-indigo-600">{progress}%</p>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 font-semibold text-lg">
              ✓ File downloaded successfully!
            </div>
            <p className="text-gray-600">Check your downloads folder</p>
            <button
              onClick={createRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Receive Another File
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 Direct P2P transfer via WiFi • No cloud storage
          </p>
        </div>
      </div>
    </div>
  );
}

function PhoneView({ onBack }: { onBack: () => void }) {
  const [roomId, setRoomId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'sending' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);

  const handleConnect = async () => {
    if (!roomId || roomId.length !== 6) {
      alert('Please enter a valid 6-digit code');
      return;
    }
    setStatus('connecting');
    await setupWebRTC(roomId.toUpperCase());
  };

  const setupWebRTC = async (id: string) => {
    try {
      const res = await fetch(`/api/signaling/poll/${id}`);
      const data = await res.json();
      
      if (!data.offer) {
        setStatus('error');
        return;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      const channel = pc.createDataChannel('fileTransfer');
      channelRef.current = channel;

      channel.onopen = () => {
        setStatus('connected');
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch(`/api/signaling/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'answer', data: answer })
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`/api/signaling/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'ice', data: event.candidate })
          });
        }
      };
    } catch (err) {
      console.error('WebRTC setup error:', err);
      setStatus('error');
    }
  };

  const handleSend = async () => {
    if (!file || !channelRef.current) return;

    setStatus('sending');
    const channel = channelRef.current;

    channel.send(JSON.stringify({ name: file.name, size: file.size }));

    const chunkSize = 16384;
    let offset = 0;

    const readSlice = () => {
      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          channel.send(e.target.result as ArrayBuffer);
          offset += chunkSize;
          setProgress(Math.round((offset / file.size) * 100));
          
          if (offset < file.size) {
            readSlice();
          } else {
            channel.close();
            setStatus('complete');
          }
        }
      };
      
      reader.readAsArrayBuffer(slice);
    };

    readSlice();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">
        <button onClick={onBack} className="text-gray-600 hover:text-gray-800 mb-4">← Back</button>
        
        <div className="text-center mb-8">
          <div className={`inline-block p-4 rounded-full mb-4 ${
            status === 'complete' ? 'bg-green-100' : 'bg-indigo-100'
          }`}>
            {status === 'complete' ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <Upload className="w-12 h-12 text-indigo-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Send File</h2>
        </div>

        {status === 'idle' && (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Pairing Code:</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 text-2xl font-mono text-center border-2 border-gray-300 rounded-xl focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              onClick={handleConnect}
              disabled={roomId.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Connect
            </button>
          </div>
        )}

        {status === 'connecting' && (
          <div className="text-center">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Connecting to computer...</p>
          </div>
        )}

        {status === 'connected' && !file && (
          <div className="space-y-4">
            <div className="text-center text-green-600 font-semibold mb-4">
              ✓ Connected!
            </div>
            <label className="block">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-600 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold">Choose File</p>
                <p className="text-sm text-gray-500 mt-2">Any file, any size</p>
              </div>
            </label>
          </div>
        )}

        {file && status === 'connected' && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">Selected file:</p>
              <p className="font-semibold text-gray-800 truncate">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={handleSend}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Send File
            </button>
          </div>
        )}

        {status === 'sending' && (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-2xl font-bold text-indigo-600">{progress}%</p>
            <p className="text-center text-gray-600">Sending {file?.name}</p>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-green-600 font-semibold text-lg">
              ✓ File sent successfully!
            </div>
            <button
              onClick={() => {
                setStatus('idle');
                setFile(null);
                setRoomId('');
                setProgress(0);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Send Another File
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
            <p className="text-red-600 font-semibold">Connection failed</p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            🔒 Direct P2P transfer via WiFi • No file size limit
          </p>
        </div>
      </div>
    </div>
  );
}
