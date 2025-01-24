import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, PartyPopper, RotateCcw, Trash2, Download, Maximize, Minimize, Flame, History } from 'lucide-react';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Fireworks } from '@fireworks-js/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Howl } from 'howler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 1200);
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
  const [historicalWinners, setHistoricalWinners] = useState<Array<{ number: number; name: string; timestamp: string }>>([]);
  const [currentDrawing, setCurrentDrawing] = useState<string | null>(null);
  const [winnerCount, setWinnerCount] = useState(1);
  const [inputWinnerCount, setInputWinnerCount] = useState<string>('1');
  const [error, setError] = useState('');
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showAllWinnersDialog, setShowAllWinnersDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showHistoryMessage, setShowHistoryMessage] = useState(false);
  const [historyMessage, setHistoryMessage] = useState('');
  const [currentWinner, setCurrentWinner] = useState<{ number: number; name: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [skipWinners, setSkipWinners] = useState(true);
  const spinRef = useRef<NodeJS.Timeout | null>(null);
  const dialogTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showManualFirework, setShowManualFirework] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  // Sound effects
  const spinningSound = useRef(new Howl({
    src: ['/sounds/winnerLoading.mp3'],
    loop: true
  }));
  
  const winnerSound = useRef(new Howl({
    src: ['/sounds/winnerShow.mp3']
  }));
  
  const applauseSound = useRef(new Howl({
    src: ['/sounds/applause.mp3']
  }));

  // Function to stop all sounds
  const stopAllSounds = () => {
    spinningSound.current.stop();
    winnerSound.current.stop();
    applauseSound.current.stop();
  };

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setFileName(file.name);
      const text = await file.text();
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => `"${line}"`); // 用引號包住每個名字
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

  const addToHistory = (winner: { number: number; name: string }) => {
    // Check if winner already exists in history
    const isDuplicate = historicalWinners.some(hw => hw.name === winner.name);
    if (isDuplicate) {
      setHistoryMessage(`${winner.name} 已經在歷史名單中`);
      setShowHistoryMessage(true);
      setTimeout(() => setShowHistoryMessage(false), 2000);
      return;
    }

    const timestamp = new Date().toLocaleString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const newHistoricalWinner = { ...winner, timestamp };
    const updatedHistory = [...historicalWinners, newHistoricalWinner];
    setHistoricalWinners(updatedHistory);
    localStorage.setItem('lotteryWinners', JSON.stringify(updatedHistory));
    setHistoryMessage(`已將 ${winner.name} 加入歷史`);
    setShowHistoryMessage(true);
    setTimeout(() => setShowHistoryMessage(false), 2000);
  };

  // Load historical winners from localStorage on component mount
  useEffect(() => {
    const savedWinners = localStorage.getItem('lotteryWinners');
    if (savedWinners) {
      setHistoricalWinners(JSON.parse(savedWinners));
    }
  }, []);

  const handleAddToHistory = () => {
    if (winners.length === 0) {
      setHistoryMessage('目前沒有得獎名單可以加入歷史');
      setShowHistoryMessage(true);
      setTimeout(() => setShowHistoryMessage(false), 2000);
      return;
    }

    // Filter out winners that already exist in history
    const duplicateWinners = winners.filter(winner => 
      historicalWinners.some(hw => hw.name === winner.name)
    );
    const newWinners = winners.filter(winner => 
      !historicalWinners.some(hw => hw.name === winner.name)
    );

    if (newWinners.length === 0) {
      const duplicateList = duplicateWinners.map(w => w.name).join('、');
      setHistoryMessage(`${duplicateList} ⚠️ 已經在歷史名單中`);
      setShowHistoryMessage(true);
      setTimeout(() => setShowHistoryMessage(false), 2000);
      return;
    }

    const timestamp = new Date().toLocaleString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const newHistoricalWinners = newWinners.map(winner => ({
      ...winner,
      timestamp
    }));

    // 更新歷史記錄
    const updatedHistory = [...historicalWinners, ...newHistoricalWinners];
    setHistoricalWinners(updatedHistory);
    localStorage.setItem('lotteryWinners', JSON.stringify(updatedHistory));

    // 只顯示這次新加入的名單
    const winnersList = newWinners.map(w => w.name).join('、');
    let message = `已將 ${winnersList} 加入歷史名單`;
    if (duplicateWinners.length > 0) {
      const duplicateList = duplicateWinners.map(w => w.name).join('、');
      message += `\n${duplicateList} 已在歷史名單中，未重複加入`;
    }
    setHistoryMessage(message);
    setShowHistoryMessage(true);
    setTimeout(() => setShowHistoryMessage(false), 2000);
  };

  // 使用 Crypto.getRandomValues() 生成更安全的隨機數
  const secureRandom = () => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  };

  // Fisher-Yates 洗牌算法
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(secureRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    const totalDuration = 2500; // 總動畫時間
    const interval = 50; // 更新間隔
    let currentWinnerIndex = 0;
    let remainingOptions = [...options];

    // Filter out history winners if skipWinners is checked
    if (skipWinners) {
      // 合併歷史得獎者和當前得獎者
      const allWinners = [...historicalWinners, ...winners];
      const winnerNames = new Set(allWinners.map(winner => winner.name));
      remainingOptions = remainingOptions.filter(name => {
        // 移除可能的引號後再比對
        const cleanName = name.replace(/^"|"$/g, '');
        return !winnerNames.has(cleanName);
      });
      
      if (remainingOptions.length < winnerCount) {
        setError(`人數不足：歷史得獎者已被排除，剩 ${remainingOptions.length} 人`);
        setIsSpinning(false);
        return;
      }
    }

    // 先對剩餘選項進行洗牌
    remainingOptions = shuffleArray(remainingOptions);
    let animationOptions = [...remainingOptions]; // 用於動畫展示的陣列
    
    spinningSound.current.play();
    
    const animate = () => {
      if (duration >= totalDuration) {
        if (currentWinnerIndex < winnerCount) {
          setCurrentDrawing(null);
          
          // 從已洗牌的陣列中取得下一個得獎者
          const selectedOption = remainingOptions[currentWinnerIndex];
          
          const newWinner = {
            number: currentWinnerIndex + 1,
            name: selectedOption.replace(/^"|"$/g, '') // 移除引號
          };
          
          setWinners(prev => [...prev, newWinner]);
          setCurrentWinner(newWinner);
          setShowWinnerDialog(true);
          
          stopAllSounds();
          winnerSound.current.play();
          
          if (dialogTimeoutRef.current) {
            clearTimeout(dialogTimeoutRef.current);
          }
          
          dialogTimeoutRef.current = setTimeout(() => {
            setShowWinnerDialog(false);
            setCurrentWinner(null);
            
            if (currentWinnerIndex + 1 < winnerCount) {
              setTimeout(() => {
                currentWinnerIndex++;
                duration = 0;
                animationOptions = remainingOptions.filter((_, index) => index > currentWinnerIndex);
                stopAllSounds();
                spinningSound.current.play();
                animate();
              }, 100);
            } else {
              setIsSpinning(false);
              setProgress(100);
              stopAllSounds();
              applauseSound.current.play();
            }
          }, 4000);
          
          return;
        }
      }
      
      // 動畫過程中的隨機展示
      const displayIndex = Math.floor(secureRandom() * animationOptions.length);
      setCurrentDrawing(animationOptions[displayIndex].replace(/^"|"$/g, '')); // 移除引號
      duration += interval;
      setProgress((duration / totalDuration) * 100);
      spinRef.current = setTimeout(animate, interval);
    };
    
    animate();
  };

  // 快抽模式
  const quickDraw = () => {
    // Reset error message first
    setError('');
    
    // Stop any playing sounds first
    spinningSound.current.stop();
    winnerSound.current.stop();
    
    if (options.length === 0 || winnerCount > options.length) {
      setError('抽獎人數不能大於參與人數');
      return;
    }
    
    let remainingOptions = [...options];

    // Filter out history winners if skipWinners is checked
    if (skipWinners) {
      // 合併歷史得獎者和當前得獎者
      const allWinners = [...historicalWinners, ...winners];
      const winnerNames = new Set(allWinners.map(winner => winner.name));
      remainingOptions = remainingOptions.filter(name => {
        // 移除可能的引號後再比對
        const cleanName = name.replace(/^"|"$/g, '');
        return !winnerNames.has(cleanName);
      });
      
      if (remainingOptions.length < winnerCount) {
        setError(`人數不足：歷史得獎者已被排除，剩 ${remainingOptions.length} 人`);
        return;
      }
    }
    
    // 使用 Fisher-Yates 洗牌並直接取前 N 個
    const shuffledOptions = shuffleArray(remainingOptions);
    const newWinners = shuffledOptions.slice(0, winnerCount).map((winner, index) => ({
      number: index + 1,
      name: winner.replace(/^"|"$/g, '') // 移除引號
    }));
    
    setWinners(newWinners);
    setProgress(100);
    setTimeout(() => {
      applauseSound.current.play();
    }, 2000);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-green-600 p-6 animate-gradient bg-[size:200%_200%]" 
      style={{ animation: 'gradientAnimation 5s ease infinite' }}
    >
      <div className={`w-full ${isMobile ? 'max-w-full max-h-screen overflow-y-auto' : 'max-w-6xl'} bg-white rounded-xl shadow-2xl p-8`}>
        <div className={`flex ${isMobile ? 'flex-col' : 'gap-4'}`}>
          {/* 左側抽獎區域 */}
          <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[600px]'}`}>
            {/* 標題 */}
            <h1 className="text-3xl font-bold text-left mb-6 text-purple-600">
              和信醫院{new Date().getFullYear()}春酒抽獎
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
                <div className="flex w-[150px] items-center px-4 py-2 bg-white rounded-lg shadow-lg">
                  <span className="text-purple-600 whitespace-nowrap mr-2">抽獎人數:</span>
                  <input
                    type="text"
                    value={inputWinnerCount}
                    onChange={handleWinnerCountChange}
                    className="w-10 border-none bg-transparent text-purple-600 focus:outline-none text-left"
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
                        <span className="text-purple-600">{currentDrawing || '得獎的是...'}</span>
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
                  onClick={() => {
                    stopAllSounds();
                    spin();
                  }}
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
                  onClick={() => {
                    stopAllSounds();
                    quickDraw();
                  }}
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
        <DialogContent className="sm:max-w-[80vw] animate-in fade-in-50 zoom-in-95 duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-300">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">歷史得獎名單</h2>
            <div className="space-y-4">
              {historicalWinners.length > 0 ? (
                Object.entries(
                  historicalWinners.reduce((acc, winner) => {
                    if (!acc[winner.timestamp]) {
                      acc[winner.timestamp] = [];
                    }
                    acc[winner.timestamp].push(winner);
                    return acc;
                  }, {} as Record<string, typeof historicalWinners>)
                )
                .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                .map(([timestamp, groupWinners]) => (
                  <div key={timestamp} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 mb-2 font-medium">
                      {timestamp}
                    </div>
                    <div className="space-y-2">
                      {groupWinners.map((winner, index) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded">
                          <span className="font-medium">#{winner.number}</span>
                          <span>{winner.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-4">
                  還沒有歷史得獎紀錄
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                disabled={historicalWinners.length === 0}
                onClick={() => setShowClearHistoryDialog(true)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors w-1/2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清除歷史
              </button>
              <button
                onClick={() => setShowHistoryDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors w-1/2"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded-full z-50">
          {historyMessage}
        </div>
      )}

      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要清除所有歷史紀錄嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此動作無法復原，所有的歷史得獎紀錄都會被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setHistoricalWinners([]);
                localStorage.removeItem('lotteryWinners');
                setShowClearHistoryDialog(false);
              }}
            >
              確定清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div 
        className="flex items-center justify-center gap-2"
      >
        <button
          onClick={() => setShowManualFirework(true)}
          className="mt-8 bg-black/50 p-3 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
          title="Trigger Firework"
        >
          <Flame className="w-5 h-5 text-white" />
        </button>
        <div 
          className="text-center text-white text-sm mt-8 bg-black/50 px-4 py-3 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
          onClick={stopAllSounds}
        >
          ⓒ 林協霆 🦎 made with ❤️🫰
        </div>
        <button
          onClick={toggleFullScreen}
          className="mt-8 bg-black/50 p-3 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
          title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
        >
          {isFullScreen ? (
            <Minimize className="w-5 h-5 text-white" />
          ) : (
            <Maximize className="w-5 h-5 text-white" />
          )}
        </button>
        <button
          onClick={() => setShowHistoryDialog(true)}
          className="mt-8 bg-black/50 p-3 rounded-full cursor-pointer hover:bg-black/60 transition-colors"
          title="Show History"
        >
          <History className="w-5 h-5 text-white" />
        </button>
      </div>
      {showManualFirework && (
        <Fireworks
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
            position: 'fixed',
            zIndex: 1000
          }}
          onClick={() => setShowManualFirework(false)}
        />
      )}
    </div>
  );
};

export default LotteryInterface;
