'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Song {
  id: string;
  title: string;
  audioUrl: string;
  prompt: string;
  createdAt: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [showSongs, setShowSongs] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [showTips, setShowTips] = useState(false);

  const checkStatus = async (taskId: string) => {
    const maxAttempts = 20; // 10 minutes max (20 * 30 seconds) - following API recommendations
    let attempts = 0;
    const startTime = Date.now();

    // Update timer display every second for smooth countdown
    const timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMinutes = Math.floor(elapsed / 60);
      const elapsedSeconds = elapsed % 60;
      setStatusMessage(`Generating your song... ${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`);
    }, 1000);

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const response = await fetch(`/api/status?taskId=${taskId}`);
        
        if (!response.ok) {
          console.error('Status check failed:', response.status);
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds as recommended
          continue;
        }

        const data = await response.json();
        
        // Log for debugging
        console.log('Poll response:', data);

        if (data.error) {
          // Check if it's a sensitive word error
          if (data.sensitiveWordError) {
            setError('⚠️ Content Moderation: Your prompt contains words that are not allowed. Please try:\n' + '• Avoiding violent, explicit, or offensive content\n' + '• Using more general descriptions\n' + '• Focusing on musical style and mood instead of specific topics');
          } else {
            setError(data.error);
          }
          setLoading(false);
          return;
        }

        if (data.status === 'SUCCESS' && data.audioUrl) {
          clearInterval(timerInterval); // Stop the timer
          setAudioUrl(data.audioUrl);
          setSongTitle(data.title || 'Your Song');
          setStatusMessage('Song ready!');
          setLoading(false);
          
          // Save to localStorage
          const song: Song = {
            id: taskId,
            title: data.title || 'Your Song',
            audioUrl: data.audioUrl,
            prompt: prompt,
            createdAt: new Date().toISOString()
          };
          const saved = JSON.parse(localStorage.getItem('sunoSongs') || '[]') as Song[];
          saved.unshift(song);
          localStorage.setItem('sunoSongs', JSON.stringify(saved.slice(0, 50))); // Keep last 50
          
          return;
        } else if (data.status === 'FAILED') {
          clearInterval(timerInterval); // Stop the timer
          setError('Music generation failed. Please try again.');
          setLoading(false);
          return;
        } else if (data.status === 'GENERATING' || data.status === 'PENDING') {
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds as recommended by API docs
        } else {
          // Unknown status, keep polling
          await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds as recommended
        }
      } catch {
        console.error('Status check error');
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds as recommended
      }
    }

    clearInterval(timerInterval); // Stop the timer on timeout
    setError('Generation timed out after 10 minutes. The song may still be processing. Please check back later or try again.');
    setLoading(false);
  };

  const generateSong = async () => {
    if (!prompt.trim()) {
      setError('Please enter a song idea');
      return;
    }

    // Basic content validation
    const sensitivePatterns = /\b(kill|death|violence|explicit|nsfw|sexual|drug|hate)\b/i;
    if (sensitivePatterns.test(prompt)) {
      setError('⚠️ Warning: Your prompt may contain sensitive content that could be rejected. Consider using more neutral language.');
      // Still allow submission, just warn
    }

    setLoading(true);
    setError('');
    setAudioUrl('');
    setSongTitle('');
    setStatusMessage('Starting generation...');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
      } else if (data.taskId) {
        setStatusMessage('Task created, waiting for generation...');
        await checkStatus(data.taskId);
      }
    } catch {
      setError('Failed to generate song. Please try again.');
      setLoading(false);
    }
  };

  const downloadSong = async () => {
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${songTitle || 'song'}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download song. Please try again.');
    }
  };

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setCredits(data.credits);
      }
    } catch {
      setError('Failed to fetch credits');
    }
  };

  const loadSongHistory = () => {
    const saved = JSON.parse(localStorage.getItem('sunoSongs') || '[]') as Song[];
    setSongs(saved);
    setShowSongs(!showSongs);
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-primary-accent">SYNC AI</h1>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm hover:text-primary-accent transition">Sign In</Link>
          <Link href="/signup" className="text-sm bg-primary-accent px-4 py-2 rounded-full hover:bg-secondary-accent transition">Sign Up</Link>
        </div>
      </header>
      <main className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Create Your Next Hit</h2>
            <p className="text-gray-400 md:text-lg">Describe your song and let our AI bring it to life.</p>
          </div>

          <div className="bg-card-background p-6 rounded-2xl shadow-lg">
            <div className="relative mb-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., an upbeat pop song about a summer road trip..."
                className="w-full h-36 p-4 bg-input-background border-2 border-gray-700 rounded-lg focus:border-primary-accent focus:outline-none resize-none transition"
                disabled={loading}
                maxLength={500}
              />
              <div className={`absolute bottom-3 right-3 text-xs font-semibold ${ 
                prompt.length > 450 ? 'text-red-500' :
                prompt.length > 200 ? 'text-orange-500' :
                'text-gray-400'
              }`}>
                {prompt.length}/500
              </div>
            </div>

            <button
              onClick={generateSong}
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Generating...' : 'Create Song'}
            </button>

            {loading && statusMessage && (
              <div className="mt-4 p-4 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg text-blue-300">
                <div className="flex items-center space-x-3">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-red-300">
                <div className="whitespace-pre-line">{error}</div>
              </div>
            )}

            {audioUrl && (
              <div className="mt-6 p-6 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg space-y-4">
                <p className="text-green-300 font-semibold text-lg">{songTitle}</p>
                <audio controls className="w-full" src={audioUrl}>
                  Your browser does not support audio playback.
                </audio>
                <button
                  onClick={downloadSong}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Song</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition text-sm cursor-pointer"
            >
              💰 Check Credits {credits !== null && `(${credits})`}
            </button>
            <button
              onClick={loadSongHistory}
              className="flex-1 bg-purple-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-600 transition text-sm cursor-pointer"
            >
              🎵 {showSongs ? 'Hide History' : 'Show History'}
            </button>
          </div>

          {showSongs && (
            <div className="mt-6 p-4 bg-card-background rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-bold mb-4 text-lg">Your Song History</h3>
              {songs.length === 0 ? (
                <p className="text-gray-400 text-sm">No songs generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {songs.map((song: Song) => (
                    <div key={song.id} className="p-4 bg-input-background rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{song.title}</p>
                        <p className="text-xs text-gray-400">{new Date(song.createdAt).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{song.prompt}</p>
                      </div>
                      <button
                        onClick={() => {
                          setAudioUrl(song.audioUrl);
                          setSongTitle(song.title);
                          setShowSongs(false);
                        }}
                        className="ml-4 px-4 py-2 bg-primary-accent text-white text-xs font-semibold rounded-full hover:bg-secondary-accent transition cursor-pointer"
                      >
                        Play
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}