import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, PartyPopper } from 'lucide-react';
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Fireworks } from '@fireworks-js/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const LotteryInterface = () => {
  const [options, setOptions] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const spinRef = useRef<NodeJS.Timeout | null>(null);

  // 處理文件上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        setError('文件內容不能為空');
        return;
      }
      setOptions(lines);
      setError('');
      setWinner(null);
    } catch (err) {
      setError('讀取文件時發生錯誤');
    }
  };

  // 抽獎動畫效果
  const spin = () => {
    if (isSpinning || options.length === 0) return;
    
    setIsSpinning(true);
    setWinner(null);
    setProgress(0);
    
    let duration = 0;
    const totalDuration = 3000; // 總動畫時間
    const interval = 50; // 更新間隔
    
    const animate = () => {
      if (duration >= totalDuration) {
        setIsSpinning(false);
        const winnerIndex = Math.floor(Math.random() * options.length);
        setWinner(options[winnerIndex]);
        setShowWinnerDialog(true);
        setProgress(100);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * options.length);
      setWinner(options[randomIndex]);
      duration += interval;
      setProgress((duration / totalDuration) * 100);
      spinRef.current = setTimeout(animate, interval);
    };
    
    animate();
  };

  useEffect(() => {
    return () => {
      if (spinRef.current) {
        clearTimeout(spinRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-6">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl p-8">
        <div className="flex gap-8">
          {/* 左側抽獎區域 */}
          <div className="flex-1">
            {/* 標題 */}
            <h1 className="text-4xl font-bold text-center mb-8 text-purple-600 animate-pulse">
              和信醫院2025春酒抽獎
            </h1>

            {/* Progress Bar */}
            {isSpinning && (
              <div className="mb-4">
                <Progress value={progress} className="w-full h-2" />
              </div>
            )}
            
            {/* 上傳區域 */}
            <div className="relative group mb-8">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">點擊上傳</span> 或拖放文件
                  </p>
                  <p className="text-xs text-gray-500">支援 TXT 文件</p>
                </div>
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* 錯誤提示 */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            {/* 抽獎結果展示 */}
            <div className="relative mb-8">
              <div className={`h-40 border-2 rounded-lg flex items-center justify-center ${isSpinning ? 'bg-purple-50' : 'bg-white'}`}>
                <div className={`text-2xl font-bold text-center p-4 ${isSpinning ? 'animate-bounce' : ''}`}>
                  {winner ? (
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                      <span className="text-purple-600">{winner}</span>
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                    </div>
                  ) : (
                    <span className="text-gray-400">等待抽獎...</span>
                  )}
                </div>
              </div>
            </div>

            {/* 抽獎按鈕 */}
            <button
              onClick={spin}
              disabled={isSpinning || options.length === 0}
              className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-all duration-300
                ${isSpinning || options.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              {isSpinning ? '抽獎中...' : '開始抽獎'}
            </button>
          </div>

          {/* 右側選項列表 */}
          <div className="w-80 border-l pl-8">
            {options.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">已載入選項 ({options.length})</h2>
                <div className="max-h-[600px] overflow-y-auto">
                  {options.map((option, index) => (
                    <div 
                      key={index}
                      className="py-2 px-4 border-b last:border-b-0 text-gray-600 hover:bg-purple-50 transition-colors duration-200"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copyright text */}
      <div className="fixed bottom-4 right-4 text-white text-lg">
        Ⓒ 林協霆 made with ❤️
      </div>

      {/* Winner Dialog */}
      <Dialog 
        open={showWinnerDialog} 
        onOpenChange={setShowWinnerDialog}
      >
        <DialogContent 
          className="sm:max-w-[800px] min-h-[600px] overflow-hidden relative data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-2xl p-8 focus:outline-none"
          style={{
            maxHeight: '90vh',
            width: '90vw'
          }}
        >
          <div className="absolute inset-0">
            {showWinnerDialog && (
              <Fireworks
                options={{
                  opacity: 0.5,
                  acceleration: 1.05,
                  friction: 0.97,
                  gravity: 1.5,
                  particles: 50,
                  explosion: 7,
                  intensity: 30,
                  traceSpeed: 10,
                  rocketsPoint: {
                    min: 0,
                    max: 100
                  },
                  lineWidth: {
                    explosion: {
                      min: 1,
                      max: 3
                    },
                    trace: {
                      min: 1,
                      max: 2
                    }
                  },
                  hue: {
                    min: 0,
                    max: 360
                  }
                }}
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  background: 'transparent',
                  zIndex: 0
                }}
              />
            )}
          </div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-center text-4xl font-bold text-purple-600">
              🎊 恭喜中獎 🎊
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-16 relative z-10">
            <PartyPopper className="w-32 h-32 text-yellow-500 mb-8" />
            <div className="text-8xl font-bold text-purple-600 mb-6">
              {winner}
            </div>
            <div className="text-4xl text-gray-600">
              恭喜您成為幸運得主！
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LotteryInterface;
