import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, PartyPopper, RotateCcw, Trash2, Download } from 'lucide-react';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Fireworks } from '@fireworks-js/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

const WinnersList = ({ winners, isMobile }: { winners: Array<{ number: number; name: string }>, isMobile: boolean }) => {
  return (
    <div className={`space-y-2 ${isMobile ? 'w-full px-2' : ''}`}>
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2 max-h-[420px] overflow-y-auto pr-2`}>
        {winners.map((winner, index) => (
          <div
            key={index}
            className="flex items-center px-3 py-2 bg-purple-50 rounded-lg"
          >
            <PartyPopper className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
            <span className="text-purple-600 text-left flex-1 overflow-hidden text-ellipsis">
              {winner.number}. {winner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LotteryInterface = () => {
  const isMobile = useIsMobile();
  const [options, setOptions] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState<Array<{ number: number; name: string }>>([]);
  const [currentDrawing, setCurrentDrawing] = useState<string | null>(null);
  const [winnerCount, setWinnerCount] = useState(1);
  const [inputWinnerCount, setInputWinnerCount] = useState<string>('1');
  const [error, setError] = useState('');
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showAllWinnersDialog, setShowAllWinnersDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyMessage, setHistoryMessage] = useState('');
  const [currentWinner, setCurrentWinner] = useState<{ number: number; name: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [skipWinners, setSkipWinners] = useState(true);
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const dialogTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setFileName(file.name);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('文件內容不能為空');
        return;
      }
      setOptions(lines);
      setError('');
      setWinners([]);
    } catch (err) {
      setError('讀取文件時發生錯誤');
    }
  };

  const handleReload = () => {
    setOptions([]);
    setWinners([]);
    setError('');
    setCurrentDrawing(null);
    setProgress(0);
    setIsSpinning(false);
    setFileName('');
    setInputWinnerCount('1');
    setWinnerCount(1);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleClearWinners = () => {
    setWinners([]);
    setCurrentDrawing(null);
    setProgress(0);
  };

  const handleDownloadWinners = () => {
    // Create CSV content
    const csvContent = winners
      .map(winner => `${winner.number},${winner.name}`)
      .join('\n');
    
    // Get current time in HHmm format
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultFilename = `中獎名單-${hours}${minutes}.csv`;
    
    // Prompt for filename
    const filename = window.prompt('請輸入檔案名稱:', defaultFilename) || defaultFilename;
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWinnerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty or numeric input
    if (value === '' || /^\d+$/.test(value)) {
      setInputWinnerCount(value);
      const numValue = value === '' ? 1 : parseInt(value, 10);
      // Only ensure it's at least 1
      if (numValue >= 1) {
        setWinnerCount(numValue);
      }
    }
  };

  const handleAddToHistory = () => {
    if (winners.length === 0) {
      setHistoryMessage('目前沒有得獎名單可以加入歷史');
      setShowHistoryDialog(true);
      setTimeout(() => setShowHistoryDialog(false), 2000);
      return;
    }

    const historyWinners = JSON.parse(localStorage.getItem('lotteryHistory') || '[]');
    const newWinners = winners.map(w => w.name);
    const duplicates = newWinners.filter(name => historyWinners.includes(name));
    
    if (duplicates.length > 0) {
      setHistoryMessage(`注意：${duplicates.join(', ')} 已在歷史名單中`);
    } else {
      setHistoryMessage(`已將 ${newWinners.length} 位得獎者加入歷史名單`);
    }
    
    const newHistory = [...historyWinners, ...newWinners];
    localStorage.setItem('lotteryHistory', JSON.stringify(newHistory));
    setShowHistoryDialog(true);
    setTimeout(() => setShowHistoryDialog(false), 2000);
  };

  // 抽獎動畫效果
  const spin = () => {
    if (isSpinning || options.length === 0 || winnerCount > options.length) {
      setError('抽獎人數不能大於參與人數');
      return;
    }
    
    setIsSpinning(true);
    setCurrentDrawing(null);
    setWinners([]);
    setProgress(0);
    
    let duration = 0;
    const totalDuration = 2000; // 總動畫時間
    const interval = 50; // 更新間隔
    let currentWinnerIndex = 0;
    let remainingOptions = [...options];

    // Filter out history winners if skipWinners is checked
    if (skipWinners) {
      const historyWinners = JSON.parse(localStorage.getItem('lotteryHistory') || '[]');
      remainingOptions = remainingOptions.filter(name => !historyWinners.includes(name));
      
      // If there are fewer people available than needed
      if (remainingOptions.length < winnerCount) {
        // Draw all remaining people
        const allWinners = remainingOptions.map((name, index) => ({
          number: index + 1,
          name: name
        }));
        setWinners(allWinners);
        setIsSpinning(false);
        setProgress(100);
        setShowAllWinnersDialog(true);
        setTimeout(() => setShowAllWinnersDialog(false), 3000);
        return;
      }
    }
    
    const animate = () => {
      if (duration >= totalDuration) {
        if (currentWinnerIndex < winnerCount) {
          // 抽出一位得獎者
          const randomIndex = Math.floor(Math.random() * remainingOptions.length);
          const winner = remainingOptions[randomIndex];
          remainingOptions.splice(randomIndex, 1);
          
          const newWinner = {
            number: currentWinnerIndex + 1,
            name: winner
          };
          
          setWinners(prev => [...prev, newWinner]);
          setCurrentWinner(newWinner);
          setShowWinnerDialog(true);
          
          // 3秒後自動關閉對話框
          if (dialogTimeoutRef.current) {
            clearTimeout(dialogTimeoutRef.current);
          }
          dialogTimeoutRef.current = setTimeout(() => {
            setShowWinnerDialog(false);
            setCurrentWinner(null);
            
            // 如果還有下一位要抽，等對話框關閉後再繼續
            if (currentWinnerIndex + 1 < winnerCount) {
              setTimeout(() => {
                currentWinnerIndex++;
                duration = 0;
                animate();
              }, 100);
            } else {
              // 全部抽完
              setIsSpinning(false);
              setProgress(100);
            }
          }, 3000);
          
          return;
        }
      }
      
      const randomIndex = Math.floor(Math.random() * remainingOptions.length);
      setCurrentDrawing(remainingOptions[randomIndex]);
      duration += interval;
      setProgress((duration / totalDuration) * 100);
      spinRef.current = setTimeout(animate, interval);
    };
    
    animate();
  };

  // 快抽模式
  const quickDraw = () => {
    if (options.length === 0 || winnerCount > options.length) {
      setError('抽獎人數不能大於參與人數');
      return;
    }
    
    let remainingOptions = [...options];

    // Filter out history winners if skipWinners is checked
    if (skipWinners) {
      const historyWinners = JSON.parse(localStorage.getItem('lotteryHistory') || '[]');
      remainingOptions = remainingOptions.filter(name => !historyWinners.includes(name));
      
      // If there are fewer people available than needed
      if (remainingOptions.length < winnerCount) {
        // Draw all remaining people
        const allWinners = remainingOptions.map((name, index) => ({
          number: index + 1,
          name: name
        }));
        setWinners(allWinners);
        setProgress(100);
        setShowAllWinnersDialog(true);
        setTimeout(() => setShowAllWinnersDialog(false), 3000);
        return;
      }
    }
    
    let newWinners = [];
    
    // 直接抽出所有得獎者
    for (let i = 0; i < winnerCount; i++) {
      const randomIndex = Math.floor(Math.random() * remainingOptions.length);
      const winner = remainingOptions[randomIndex];
      remainingOptions.splice(randomIndex, 1);
      
      newWinners.push({
        number: i + 1,
        name: winner
      });
    }
    
    setWinners(newWinners);
    setProgress(100);
  };

  useEffect(() => {
    return () => {
      if (spinRef.current) {
        clearTimeout(spinRef.current);
      }
      if (dialogTimeoutRef.current) {
        clearTimeout(dialogTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-6">
      <div className={`w-full ${isMobile ? 'max-w-full' : 'max-w-6xl'} bg-white rounded-xl shadow-2xl p-8`}>
        <div className={`flex ${isMobile ? 'flex-col' : 'gap-4'}`}>
          {/* 左側抽獎區域 */}
          <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[600px]'}`}>
            {/* 標題 */}
            <h1 className="text-3xl font-bold text-left mb-6 text-purple-600">
              和信醫院2025春酒抽獎
            </h1>

            <div className={`space-y-6 w-full ${isMobile ? '' : 'max-w-md'}`}>
              <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex gap-4 items-center'}`}>
                <label className="flex items-center justify-center px-4 py-2 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-purple-600 whitespace-nowrap">{fileName || '上傳名單'}</span>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleReload}
                  disabled={isSpinning}
                  className="flex items-center justify-center px-4 py-2 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-purple-600 whitespace-nowrap">重新載入</span>
                </button>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-lg">
                  <span className="text-purple-600 whitespace-nowrap mr-2">抽獎人數:</span>
                  <input
                    type="text"
                    value={inputWinnerCount}
                    onChange={handleWinnerCountChange}
                    className="w-16 border-none bg-transparent text-purple-600 focus:outline-none text-left"
                    placeholder="≥1"
                  />
                </div>
              </div>

              {/* 錯誤提示 */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}

              {/* Progress Bar */}
              {isSpinning && (
                <div className="mb-4">
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}

              {/* 抽獎結果展示 */}
              <div className="relative mb-6">
                <div className={`h-32 border-2 rounded-lg flex items-center justify-center ${isSpinning ? 'bg-purple-50' : 'bg-white'}`}>
                  {isSpinning ? (
                    <div className="text-2xl font-bold text-center animate-bounce">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        <span className="text-purple-600">{currentDrawing || '抽獎中...'}</span>
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-gray-400">等待抽獎...</span>
                  )}
                </div>
              </div>

              {/* 抽獎按鈕 */}
              <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex gap-4'}`}>
                <button
                  onClick={spin}
                  disabled={isSpinning || options.length === 0 || winnerCount > options.length}
                  className={`flex items-center justify-start px-6 py-3 rounded-lg shadow-lg transition-colors ${
                    isSpinning || options.length === 0 || winnerCount > options.length
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <Sparkles className="w-6 h-6 mr-2 text-white" />
                  <span className="text-white whitespace-nowrap">{isSpinning ? '抽獎中...' : '開始抽獎'}</span>
                </button>
                <button
                  onClick={quickDraw}
                  disabled={isSpinning || options.length === 0 || winnerCount > options.length}
                  className={`flex items-center justify-start px-6 py-3 rounded-lg shadow-lg transition-colors ${
                    isSpinning || options.length === 0 || winnerCount > options.length
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  <PartyPopper className="w-6 h-6 mr-2 text-white" />
                  <span className="text-white whitespace-nowrap">快抽模式</span>
                </button>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-lg">
                  <input
                    type="checkbox"
                    checked={skipWinners}
                    onChange={(e) => setSkipWinners(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-purple-600 whitespace-nowrap">跳過已中獎</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側中獎名單 */}
          <div className={`${isMobile ? 'w-full mt-6' : 'w-[600px]'}`}>
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-600 flex items-center text-left whitespace-nowrap">
                  <PartyPopper className="w-6 h-6 mr-2 flex-shrink-0" />
                  中獎名單
                </h2>
                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'gap-2'}`}>
                  <button
                    onClick={handleDownloadWinners}
                    className="flex items-center justify-center px-3 py-1 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="text-purple-600 whitespace-nowrap">下載名單</span>
                  </button>
                  <button
                    onClick={handleClearWinners}
                    className="flex items-center justify-center px-3 py-1 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                    <span className="text-red-600 whitespace-nowrap">清除</span>
                  </button>
                  <button
                    onClick={handleAddToHistory}
                    className="flex items-center justify-center px-3 py-1 bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="text-purple-600 whitespace-nowrap">加入歷史</span>
                  </button>
                </div>
              </div>
              <WinnersList winners={winners} isMobile={isMobile} />
            </div>
          </div>
        </div>
      </div>

      {/* 中獎對話框 */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 恭喜中獎 🎉</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 relative z-10">
            {currentWinner && (
              <div className="text-4xl font-bold text-purple-600 mb-4">
                #{currentWinner.number} {currentWinner.name}
              </div>
            )}
            <div className="text-xl text-gray-600">
              恭喜您成為幸運得主！
            </div>
          </div>
          {showWinnerDialog && <Fireworks
            options={{
              rocketsPoint: {
                min: 0,
                max: 100
              }
            }}
            style={{
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 0
            }}
          />}
        </DialogContent>
      </Dialog>

      {showAllWinnersDialog && (
        <Dialog open={showAllWinnersDialog} onOpenChange={setShowAllWinnersDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">🎉 抽獎結果 🎉</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <WinnersList winners={winners} isMobile={isMobile} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showHistoryDialog && (
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">歷史紀錄已更新</DialogTitle>
            </DialogHeader>
            <div className="text-center">
              {historyMessage}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="text-center text-white text-sm mt-8 bg-black/50 px-4 py-3 rounded-full">
        ⓒ 林協霆 made with 🫰
      </div>
    </div>
  );
};

export default LotteryInterface;
