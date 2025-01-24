import React, { useState, useEffect } from 'react';
import { RotateCcw, Users, Trophy, UserMinus, Clock, Download } from 'lucide-react';

interface Winner {
  number: number;
  name: string;
  timestamp: string;
}

const HistoryPage: React.FC = () => {
  const [historicalWinners, setHistoricalWinners] = useState<Winner[]>([]);
  const [totalParticipants, setTotalParticipants] = useState<string[]>([]);
  const [uploadedParticipants, setUploadedParticipants] = useState<string[]>([]);

  const handleDownload = (type: 'all' | 'winners' | 'remaining' | 'history', timestamp?: string) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    let content = '';
    let defaultFilename = '';

    const uniqueWinners = new Set(historicalWinners.map(w => w.name));
    const currentParticipants = uploadedParticipants.length ? uploadedParticipants : totalParticipants;
    const remainingParticipants = currentParticipants.filter(p => !uniqueWinners.has(p.replace(/"/g, '')));

    switch (type) {
      case 'all':
        content = currentParticipants.join('\n');
        defaultFilename = `全部名單-${hours}${minutes}.txt`;
        break;
      case 'winners':
        content = Array.from(uniqueWinners).join('\n');
        defaultFilename = `得獎名單-${hours}${minutes}.txt`;
        break;
      case 'remaining':
        content = remainingParticipants.join('\n');
        defaultFilename = `未中獎名單-${hours}${minutes}.txt`;
        break;
      case 'history':
        if (timestamp) {
          // Download specific timestamp winners
          const timestampWinners = historicalWinners.filter(w => w.timestamp === timestamp);
          content = timestampWinners
            .map(w => `${w.number},${w.name}`)
            .join('\n');
          const formattedTimestamp = timestamp.replace(/[/:]/g, '').replace(/\s+/g, '-');
          defaultFilename = `得獎名單-${formattedTimestamp}.csv`;
        } else {
          // Download all history
          content = historicalWinners
            .map(w => `${w.timestamp},${w.number},${w.name}`)
            .join('\n');
          defaultFilename = `抽獎紀錄-${hours}${minutes}.csv`;
        }
        break;
    }

    const filename = window.prompt('請輸入檔案名稱:', defaultFilename) || defaultFilename;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadHistory = () => {
    const savedHistory = localStorage.getItem('lotteryWinners');
    const savedParticipants = localStorage.getItem('lotteryOptions');
    const currentParticipants = localStorage.getItem('currentParticipants');
    
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistoricalWinners(parsed);
      } catch (error) {
        console.error('Error parsing history:', error);
        setHistoricalWinners([]);
      }
    }

    if (savedParticipants) {
      try {
        const parsed = JSON.parse(savedParticipants);
        setTotalParticipants(parsed);
      } catch (error) {
        console.error('Error parsing participants:', error);
        setTotalParticipants([]);
      }
    }

    if (currentParticipants) {
      try {
        const parsed = JSON.parse(currentParticipants);
        setUploadedParticipants(parsed);
      } catch (error) {
        console.error('Error parsing current participants:', error);
        setUploadedParticipants([]);
      }
    }
  };

  useEffect(() => {
    loadHistory();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lotteryWinners') {
        if (e.newValue === null) {
          setHistoricalWinners([]);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setHistoricalWinners(parsed);
          } catch (error) {
            console.error('Error parsing history from storage event:', error);
            setHistoricalWinners([]);
          }
        }
      } else if (e.key === 'lotteryOptions' && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTotalParticipants(parsed);
        } catch (error) {
          console.error('Error parsing participants from storage event:', error);
          setTotalParticipants([]);
        }
      } else if (e.key === 'currentParticipants' && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          setUploadedParticipants(parsed);
        } catch (error) {
          console.error('Error parsing current participants from storage event:', error);
          setUploadedParticipants([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Get unique winners (some people might have won multiple times)
  const uniqueWinners = new Set(historicalWinners.map(w => w.name));
  
  // Calculate statistics
  const stats = {
    totalParticipants: uploadedParticipants.length || totalParticipants.length,
    totalWinners: uniqueWinners.size,
    remainingParticipants: (uploadedParticipants.length || totalParticipants.length) - uniqueWinners.size,
    totalDraws: historicalWinners.length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">歷史得獎名單</h1>
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-md shadow-sm border flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重新整理
          </button>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="font-medium">總參與人數</span>
              </div>
              <button
                onClick={() => handleDownload('all')}
                className="text-gray-500 hover:text-gray-700"
                title="下載名單"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold">{stats.totalParticipants}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">得獎人數</span>
              </div>
              <button
                onClick={() => handleDownload('winners')}
                className="text-gray-500 hover:text-gray-700"
                title="下載名單"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold">{stats.totalWinners}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <UserMinus className="w-5 h-5" />
                <span className="font-medium">未中獎人數</span>
              </div>
              <button
                onClick={() => handleDownload('remaining')}
                className="text-gray-500 hover:text-gray-700"
                title="下載名單"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold">{stats.remainingParticipants}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">抽獎次數</span>
              </div>
              <button
                onClick={() => handleDownload('history')}
                className="text-gray-500 hover:text-gray-700"
                title="下載名單"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="text-2xl font-bold">{stats.totalDraws}</div>
          </div>
        </div>

        <div className="space-y-4">
          {historicalWinners && historicalWinners.length > 0 ? (
            Object.entries(
              historicalWinners.reduce((acc, winner) => {
                if (!acc[winner.timestamp]) {
                  acc[winner.timestamp] = [];
                }
                acc[winner.timestamp].push(winner);
                return acc;
              }, {} as Record<string, Winner[]>)
            )
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([timestamp, groupWinners]) => (
              <div key={timestamp} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm text-gray-500 font-medium">
                    {timestamp}
                  </div>
                  <button
                    onClick={() => handleDownload('history', timestamp)}
                    className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    title="下載名單"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">下載名單</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {groupWinners.map((winner, index) => (
                    <div key={`${winner.number}-${winner.name}-${index}`} className="text-gray-800">
                      {winner.number}. {winner.name}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              目前沒有歷史紀錄
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
