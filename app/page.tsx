'use client';
import { useState } from 'react';

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
            setError('⚠️ Content Moderation: Your prompt contains words that are not allowed. Please try:\n• Avoiding violent, explicit, or offensive content\n• Using more general descriptions\n• Focusing on musical style and mood instead of specific topics');
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
<main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Music Notes Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-5 animate-float text-primary-accent">🎵</div>
        <div className="absolute top-20 right-20 text-4xl opacity-5 animate-float-delayed text-secondary-accent">🎶</div>
        <div className="absolute bottom-40 left-20 text-5xl opacity-5 animate-float-slow text-primary-accent">🎼</div>
        <div className="absolute bottom-20 right-32 text-7xl opacity-5 animate-float text-secondary-accent">🎹</div>
        <div className="absolute top-1/3 left-1/4 text-3xl opacity-5 animate-float-delayed text-primary-accent">🎸</div>
        <div className="absolute top-2/3 right-1/4 text-4xl opacity-5 animate-float-slow text-secondary-accent">🎤</div>
        <div className="absolute bottom-1/2 left-10 text-5xl opacity-5 animate-float text-primary-accent">🎺</div>
        <div className="absolute top-1/2 right-10 text-6xl opacity-5 animate-float-delayed text-secondary-accent">🎧</div>
      </div>

      <div className="max-w-2xl w-full bg-card-background rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1"></div>
          <h1 className="text-4xl font-bold text-foreground text-center flex-1">
            SYNC AI Music Generator
          </h1>
          <div className="flex-1 flex justify-end">
            <span className="text-xs text-gray-400 italic">Created by AJ</span>
          </div>
        </div>
        <p className="text-gray-400 mb-2 text-center">
          Describe your song idea and let AI create it
        </p>
        <p className="text-sm text-gray-500 mb-2 text-center">
          ⏱️ Generation typically takes 2-4 minutes
        </p>
        <div className="mb-4">
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full text-xs text-secondary-accent hover:text-primary-accent transition flex items-center justify-center gap-2"
          >
            <span>💡</span>
            <span className="font-medium">
              {showTips ? 'Hide' : 'Show'} Prompt Tips & Best Practices
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showTips ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showTips && (
            <div className="mt-3 p-4 bg-background rounded-lg text-left space-y-3 border border-gray-700">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">✅ Best Practices:</h3>
                <ul className="text-xs text-gray-400 space-y-1 ml-4">
                  <li>• Keep prompts <strong>under 200 characters</strong> for best results</li>
                  <li>• Focus on <strong>musical style and mood</strong> (e.g., upbeat jazz)</li>
                  <li>• Describe <strong>instruments and genre</strong> specifically</li>
                  <li>• Use <strong>generic themes</strong> instead of specific names or places</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">❌ Avoid:</h3>
                <ul className="text-xs text-gray-400 space-y-1 ml-4">
                  <li>• Real names of people or specific locations</li>
                  <li>• Violent, explicit, or controversial content</li>
                  <li>• Very long, detailed stories (over 200 chars)</li>
                  <li>• Personal or private information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">🎵 Example Prompts:</h3>
                <div className="space-y-2">
                  <div className="bg-input-background p-2 rounded border border-gray-600">
                    <p className="text-xs text-gray-300 italic">An upbeat hip-hop song about new beginnings and confidence</p>
                  </div>
                  <div className="bg-input-background p-2 rounded border border-gray-600">
                    <p className="text-xs text-gray-300 italic">Smooth jazz ballad with piano, perfect for a romantic evening</p>
                  </div>
                  <div className="bg-input-background p-2 rounded border border-gray-600">
                    <p className="text-xs text-gray-300 italic">Energetic rock anthem about chasing dreams and never giving up</p>
                  </div>
                  <div className="bg-input-background p-2 rounded border border-gray-600">
                    <p className="text-xs text-gray-300 italic">Mellow acoustic folk song with themes of nostalgia and home</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mb-6">
          <button
            onClick={checkCredits}
            className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition text-sm"
          >
            💰 Check Credits {credits !== null && `(${credits})`}
          </button>
          <button
            onClick={loadSongHistory}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 transition text-sm"
          >
            🎵 {showSongs ? 'Hide' : 'Show'} Song History
          </button>
        </div>
        {showSongs && (
          <div className="mb-6 p-4 bg-background rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-bold mb-3 text-foreground">Your Songs ({songs.length})</h3>
            {songs.length === 0 ? (
              <p className="text-gray-400 text-sm">No songs yet. Generate your first one!</p>
            ) : (
              <div className="space-y-2">
                {songs.map((song: Song) => (
                  <div key={song.id} className="p-3 bg-card-background rounded border border-gray-700 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{song.title}</p>
                      <p className="text-xs text-gray-400">{new Date(song.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 truncate">{song.prompt}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAudioUrl(song.audioUrl);
                        setSongTitle(song.title);
                        setShowSongs(false);
                      }}
                      className="ml-2 px-3 py-1 bg-primary-accent text-white text-xs rounded hover:bg-secondary-accent"
                    >
                      ▶️ Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A melancholic jazz ballad about coffee shops..."
              className="w-full h-32 p-4 bg-input-background border-2 border-gray-600 rounded-lg text-foreground focus:border-primary-accent focus:outline-none resize-none"
              disabled={loading}
              maxLength={500}
            />
            <div className={`absolute bottom-2 right-2 text-xs font-semibold ${
              prompt.length > 450 ? 'text-red-500' :
              prompt.length > 200 ? 'text-orange-500' :
              'text-gray-400'
            }`}>
              {prompt.length}/500 {prompt.length > 200 && '⚠️ Long prompts may have issues'}
            </div>
          </div>
          <button
            onClick={generateSong}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-accent to-secondary-accent text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating your song...' : 'Generate Song'}
          </button>
          {loading && statusMessage && (
            <div className="p-4 bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg text-blue-300">
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
            <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-red-300">
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}
          {audioUrl && (
            <div className="p-6 bg-green-900 bg-opacity-50 border border-green-700 rounded-lg space-y-4">
              <p className="text-green-300 font-semibold text-lg">{songTitle}</p>
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support audio playback.
              </audio>
              <button
                onClick={downloadSong}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Song</span>
              </button>
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <p className="text-xs text-gray-500">
            Created with ❤️ by <span className="font-semibold text-primary-accent">Ajinkya Bhosle</span>
          </p>
        </div>
      </div>
    </main>
);
}
