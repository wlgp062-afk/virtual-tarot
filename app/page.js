"use client";

import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

const TAROT_DECK_MAP = {
  1: "메이저 0번: 바보 (The Fool)",
  23: "메이저 1번: 마법사 (The Magician)",
  24: "메이저 2번: 고위 여사제 (The High Priestess)",
  25: "메이저 3번: 여황제 (The Empress)",
  26: "메이저 4번: 황제 (The Emperor)",
  27: "메이저 5번: 교황 (The Hierophant)",
  28: "메이저 6번: 연인 (The Lovers)",
  29: "메이저 7번: 전차 (The Chariot)",
  30: "메이저 8번: 힘 (Strength)",
  31: "메이저 9번: 은둔자 (The Hermit)",
  32: "메이저 10번: 운명의 수레바퀴 (Wheel of Fortune)",
  33: "메이저 11번: 정의 (Justice)",
  34: "메이저 12번: 매달린 사람 (The Hanged Man)",
  35: "메이저 13번: 죽음 (Death)",
  36: "메이저 14번: 절제 (Temperance)",
  37: "메이저 15번: 악마 (The Devil)",
  38: "메이저 16번: 탑 (The Tower)",
  39: "메이저 17번: 별 (The Star)",
  40: "메이저 18번: 달 (The Moon)",
  41: "메이저 19번: 태양 (The Sun)",
  42: "메이저 20번: 심판 (Judgement)",
  43: "메이저 21번: 세계 (The World)",
  44: "지팡이(Wands) 기사 (Knight)",
  45: "지팡이(Wands) 에이스 (Ace)",
  46: "지팡이(Wands) 여왕 (Queen)",
  47: "지팡이(Wands) 왕 (King)",
  48: "지팡이(Wands) 2",
  49: "지팡이(Wands) 3",
  50: "지팡이(Wands) 4",
  51: "지팡이(Wands) 5",
  52: "지팡이(Wands) 6",
  53: "지팡이(Wands) 7",
  54: "지팡이(Wands) 8",
  55: "지팡이(Wands) 9",
  56: "지팡이(Wands) 10",
  57: "지팡이(Wands) 소년 (Page)",
  58: "컵(Cups) 기사 (Knight)",
  59: "컵(Cups) 에이스 (Ace)",
  60: "컵(Cups) 여왕 (Queen)",
  61: "컵(Cups) 왕 (King)",
  62: "컵(Cups) 2",
  63: "컵(Cups) 3",
  64: "컵(Cups) 4",
  65: "컵(Cups) 5",
  66: "컵(Cups) 6",
  67: "컵(Cups) 7",
  68: "컵(Cups) 8",
  69: "컵(Cups) 9",
  70: "컵(Cups) 10",
  71: "컵(Cups) 소년 (Page)",
  72: "검(Swords) 기사 (Knight)",
  73: "검(Swords) 에이스 (Ace)",
  74: "검(Swords) 여왕 (Queen)",
  75: "검(Swords) 왕 (King)",
  76: "검(Swords) 2",
  77: "검(Swords) 3",
  78: "검(Swords) 4",
  79: "검(Swords) 5",
  80: "검(Swords) 6",
  81: "검(Swords) 7",
  82: "검(Swords) 8",
  83: "검(Swords) 9",
  84: "검(Swords) 10",
  85: "검(Swords) 소년 (Page)",
  86: "동전(Pentacles) 기사 (Knight)",
  87: "동전(Pentacles) 에이스 (Ace)",
  88: "동전(Pentacles) 여왕 (Queen)",
  89: "동전(Pentacles) 왕 (King)",
  90: "동전(Pentacles) 2",
  91: "동전(Pentacles) 3",
  92: "동전(Pentacles) 4",
  93: "동전(Pentacles) 5",
  94: "동전(Pentacles) 6",
  95: "동전(Pentacles) 7",
  96: "동전(Pentacles) 8",
  97: "동전(Pentacles) 9",
  98: "동전(Pentacles) 10",
  99: "동전(Pentacles) 소년 (Page)"
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [mode, setMode] = useState("online");
  const [question, setQuestion] = useState(""); 
  const [numToPick, setNumToPick] = useState(4); 
  const [deck, setDeck] = useState([]); 
  const [pickedCards, setPickedCards] = useState([]); 
  const [isShuffling, setIsShuffling] = useState(false);
  const [isSpread, setIsSpread] = useState(false); 
  
  const [uploadQuestion, setUploadQuestion] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState("선택된 파일 없음");

  const [myReading, setMyReading] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState("");

  const [history, setHistory] = useState([]);
  const [currentView, setCurrentView] = useState("main");
  const [expandedId, setExpandedId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchMyHistory(currentUser.uid);
      } else {
        setHistory([]);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("로그인 에러:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('main');
      resetTable();
    } catch (error) {
      console.error("로그아웃 에러:", error);
    }
  };

  const fetchMyHistory = async (userId) => {
    try {
      const q = query(collection(db, "tarotHistory"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      let fetchedHistory = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetchedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(fetchedHistory);
    } catch (error) {
      console.error("기록 불러오기 에러:", error);
    }
  };

  const resetTable = () => {
    setIsSpread(false);
    setPickedCards([]);
    setMyReading("");
    setInterpretation("");
    setImageSrc(null);
    setFileName("선택된 파일 없음");
  };

  const shuffleAndSpread = () => {
    if (!question.trim()) {
      alert("먼저 질문을 입력해주세요! 🔮");
      return;
    }
    setIsShuffling(true);
    resetTable();

    setTimeout(() => {
      const validCardIds = [1, ...Array.from({ length: 77 }, (_, i) => i + 23)];
      validCardIds.sort(() => Math.random() - 0.5);
      
      setDeck(validCardIds.map(id => ({ 
        id, 
        isPicked: false, 
        isReversed: Math.random() < 0.5 
      })));
      
      setIsShuffling(false);
      setIsSpread(true); 
    }, 2000); 
  };

  const pickCard = (index) => {
    if (pickedCards.length >= numToPick) return;
    if (deck[index].isPicked) return;
    const newDeck = [...deck];
    newDeck[index].isPicked = true;
    setDeck(newDeck);
    setPickedCards([...pickedCards, newDeck[index]]);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setImageSrc(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const rotateImage = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height; canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      setImageSrc(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = imageSrc;
  };

  const generateInterpretation = async () => {
    const activeQuestion = mode === 'online' ? question : uploadQuestion;
    if (!activeQuestion.trim()) { alert("질문을 입력해주세요!"); return; }
    setIsInterpreting(true);
    setInterpretation("우주의 기운을 모아 카드를 읽는 중입니다... 🔮 잠시만요!");

    try {
      let promptText = "";
      let imageBase64 = null;

      if (mode === 'online') {
        const cardInfoSummary = pickedCards.map((c, idx) => 
          `${idx + 1}번째 카드: ${TAROT_DECK_MAP[c.id]} (${c.isReversed ? '역방향 🙃' : '정방향 🙂'})`
        ).join(', ');

        promptText = `너는 냉철하고 직관적인 타로 마스터야. 미사여구나 과장된 위로는 하지 않지만, 상대가 계속 리딩을 이어가고 싶어지도록 존중하는 태도를 유지해.
질문: ${activeQuestion}
뽑은 카드: ${cardInfoSummary}
사용자의 리딩: ${myReading || '아직 작성하지 않음'}
피드백을 쓸 때 반드시 지켜:
1. 먼저 리딩에서 실제로 잘 포착한 부분을 구체적으로 짚어줘.
2. 그다음 놓친 부분이나 안일했던 해석을 날카롭게 지적해.
3. 마지막은 다음에 뭘 더 눈여겨보면 좋을지 구체적인 방향을 제시하며 마무리해.
**중요: 별표(*), 샵(#), 대시(-) 같은 마크다운 특수문자는 절대 사용하지 말고, 오직 일반 텍스트 문장과 줄바꿈만 사용해서 깔끔하게 작성해줘.**
다음 양식으로 작성해줘:
1. 잘 짚은 부분:
2. 놓친 부분:
3. 카드별 의미:
4. 다음 리딩을 위한 조언:
5. AI의 리딩:`;
      } else {
        promptText = `너는 냉철하고 직관적인 타로 마스터야. 미사여구나 과장된 위로는 하지 않지만, 상대가 계속 리딩을 이어가고 싶어지도록 존중하는 태도를 유지해. 사용자가 직접 오프라인에서 카드를 뽑고 사진을 찍어 올렸어.
질문: ${activeQuestion}
사용자의 리딩: ${myReading || '아직 작성하지 않음'}
피드백을 쓸 때 반드시 지켜:
1. 먼저 리딩에서 실제로 잘 포착한 부분을 구체적으로 짚어줘.
2. 그다음 놓친 부분이나 안일했던 해석을 날카롭게 지적해.
3. 마지막은 다음에 뭘 더 눈여겨보면 좋을지 구체적인 방향을 제시하며 마무리해.
**중요: 별표(*), 샵(#), 대시(-) 같은 마크다운 특수문자는 절대 사용하지 말고, 오직 일반 텍스트 문장과 줄바꿈만 사용해서 깔끔하게 작성해줘.**`;

        if (imageSrc) {
          imageBase64 = imageSrc.split(',')[1];
        }
      }

      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText, imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI 응답 실패");
      }

      const aiComment = data.text;
      const mockResult = `[질문: ${activeQuestion}]\n\n${aiComment}`;
      
      setInterpretation(mockResult);
      setIsInterpreting(false);

      const newRecord = {
        userId: user.uid,
        createdAt: new Date().toISOString(),
        date: new Date().toLocaleString(),
        question: activeQuestion,
        cards: mode === 'online' ? pickedCards : [],
        imageSrc: mode === 'upload' ? imageSrc : null,
        myReading: myReading,
        result: mockResult,
      };
      const docRef = await addDoc(collection(db, "tarotHistory"), newRecord);
      setHistory([{ id: docRef.id, ...newRecord }, ...history]);

    } catch (error) {
      console.error(error);
      setInterpretation("앗! AI 서버가 지금 너무 바쁩니다. 잠시 후 [새로운 질문하기]를 눌러 다시 시도해주세요 ㅠㅠ");
      setIsInterpreting(false);
    }
  };

  const handleDeleteRecord = async (id, event) => {
    event.stopPropagation();
    if(confirm("정말 이 기록을 삭제할까요? 🥺")) {
      try {
        await deleteDoc(doc(db, "tarotHistory", id));
        setHistory(history.filter(record => record.id !== id));
      } catch (error) { console.error("삭제 에러:", error); }
    }
  };

  if (!isAuthReady) {
    return <div style={{...styles.background, alignItems: 'center'}}><p>🔮 우주의 기운을 모으는 중...</p></div>;
  }

  if (!user) {
    return (
      <div style={{...styles.background, alignItems: 'center'}}>
        <div style={{...styles.widgetCard, maxWidth: '400px', width: '100%', textAlign: 'center', padding: '50px 30px'}}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🌙</div>
          <h1 style={{...styles.title, fontSize: '26px'}}>Virtual Tarot</h1>
          <p style={{...styles.subtitle, marginBottom: '40px', lineHeight: '1.5'}}>
            마음을 읽어주는<br/>나만의 프라이빗 타로 일기장
          </p>
          <button onClick={loginWithGoogle} style={{...styles.primaryBtn, backgroundColor: '#FFF', color: '#333', border: '1px solid #E4E6EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}>
            <span style={{ marginRight: '8px' }}>G</span> 구글 계정으로 시작하기
          </button>
        </div>
      </div>
    );
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = history.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  if (currentView === 'main') {
    return (
      <div style={styles.background}>
        <style>{`
          @keyframes shuffle-left { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-50px, -10px) rotate(-10deg); } }
          @keyframes shuffle-right { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(50px, -10px) rotate(10deg); } }
          @keyframes shuffle-center { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        `}</style>

        <div style={styles.mainWrapper}>
          <div style={styles.topNav}>
            <div style={styles.userInfoBox}>
              <img src={user.photoURL} alt="프로필" style={styles.profileImg} referrerPolicy="no-referrer" />
              <span style={styles.userName}>{user.displayName}님</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>로그아웃</button>
            </div>
          </div>

          <div style={styles.header}>
            <div style={styles.headerIcon}>🌙</div>
            <h1 style={styles.title}>오늘의 타로 리딩</h1>
            <p style={styles.subtitle}>마음을 가다듬고 카드를 뽑아보세요</p>
          </div>

          <div style={styles.modeToggleBox}>
            <button onClick={() => { setMode('online'); resetTable(); }} style={{ ...styles.modeBtn, backgroundColor: mode === 'online' ? '#FFF' : 'transparent', color: mode === 'online' ? '#6B5B95' : '#888', boxShadow: mode === 'online' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', fontWeight: mode === 'online' ? '700' : '500' }}>🃏 온라인 카드 뽑기</button>
            <button onClick={() => { setMode('upload'); resetTable(); }} style={{ ...styles.modeBtn, backgroundColor: mode === 'upload' ? '#FFF' : 'transparent', color: mode === 'upload' ? '#6B5B95' : '#888', boxShadow: mode === 'upload' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', fontWeight: mode === 'upload' ? '700' : '500' }}>📸 내 사진 올리기</button>
          </div>

          <div style={styles.widgetCard}>
            {mode === 'online' ? (
              <>
                <p style={styles.label}>1. 어떤 고민이 있으신가요?</p>
                <input type="text" value={question} onChange={(e) => { setQuestion(e.target.value); setIsSpread(false); }} placeholder="예: 이번 주 나의 전반적인 운세는 어떨까?" style={styles.textInput} />
                <div style={{ marginTop: '20px' }}>
                  <p style={styles.label}>2. 뽑을 카드 수 (최대 6장)</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button key={num} onClick={() => { setNumToPick(num); resetTable(); }} style={{ ...styles.numBtn, backgroundColor: numToPick === num ? '#6B5B95' : '#F4F5F9', color: numToPick === num ? '#FFF' : '#555' }}>{num}장</button>
                    ))}
                  </div>
                </div>
                <button onClick={shuffleAndSpread} disabled={isShuffling} style={{ ...styles.primaryBtn, marginTop: '20px' }}>
                  {isShuffling ? '🃏 78장 카드 섞는 중...' : '✨ 타로 카드 섞고 펼치기'}
                </button>
              </>
            ) : (
              <>
                <p style={styles.label}>1. 어떤 고민이 있으신가요?</p>
                <input type="text" value={uploadQuestion} onChange={(e) => setUploadQuestion(e.target.value)} placeholder="예: 이직을 준비 중인데 조언을 구하고 싶어" style={styles.textInput} />
                <div style={{ marginTop: '20px' }}>
                  <p style={styles.label}>2. 오프라인에서 뽑은 카드 사진 📸</p>
                  <label style={styles.fileBox}>
                    <div style={styles.fileButton}>사진 선택</div>
                    <span style={styles.fileText}>{fileName}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>
                {imageSrc && (
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <img src={imageSrc} alt="업로드됨" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <br />
                    <button onClick={rotateImage} style={styles.rotateBtn}>🔄 사진 회전</button>
                  </div>
                )}
              </>
            )}
          </div>

          {mode === 'online' && isShuffling && (
            <div style={{...styles.widgetCard, textAlign: 'center', padding: '40px 20px'}}>
              <div style={{ position: 'relative', width: '90px', height: '140px', margin: '0 auto' }}>
                <img src="/cards/back.jpg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 10, animation: 'shuffle-left 0.5s ease-in-out infinite' }} alt="셔플중" />
                <img src="/cards/back.jpg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 20, animation: 'shuffle-center 0.5s ease-in-out infinite 0.1s' }} alt="셔플중" />
                <img src="/cards/back.jpg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid white', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 30, animation: 'shuffle-right 0.5s ease-in-out infinite 0.2s' }} alt="셔플중" />
              </div>
            </div>
          )}

          {mode === 'online' && isSpread && (
            <div style={styles.widgetCard}>
              <p style={{...styles.label, textAlign: 'center', marginBottom: '15px'}}>직관이 이끄는 카드를 골라주세요 ({pickedCards.length}/{numToPick})</p>
              <div style={{ overflowX: 'auto', padding: '10px 5px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '-25px', width: 'max-content', margin: '0 auto' }}>
                  {deck.map((card, index) => (
                    <div key={index} onClick={() => pickCard(index)} style={{ cursor: card.isPicked ? 'default' : 'pointer', opacity: card.isPicked ? 0.3 : 1, transform: card.isPicked ? 'scale(0.9)' : 'translateY(0)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', marginLeft: index === 0 ? '0' : '-45px' }} onMouseOver={(e) => { if(!card.isPicked) e.currentTarget.style.transform = 'translateY(-15px)'; }} onMouseOut={(e) => { if(!card.isPicked) e.currentTarget.style.transform = 'translateY(0)'; }}>
                      <img src="/cards/back.jpg" alt="카드 뒷면" style={{ width: '65px', height: '105px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #FFF', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)' }} />
                    </div>
                  ))}
                </div>
              </div>
              {pickedCards.length > 0 && (
                <div style={{ padding: '15px', backgroundColor: '#F8F9FB', borderRadius: '16px' }}>
                  <p style={{...styles.label, fontSize: '13px', textAlign: 'center'}}>내가 선택한 카드 ✨</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
                    {pickedCards.map((card, idx) => (
                      <div key={idx} style={{ textAlign: 'center', animation: 'float 3s ease-in-out infinite', animationDelay: `${idx * 0.2}s` }}>
                        <img src={`/cards/card (${card.id}).jpg`} alt="선택된 카드" style={{ width: '80px', height: '130px', objectFit: 'cover', borderRadius: '8px', border: '3px solid #fff', boxShadow: '0 6px 12px rgba(0,0,0,0.1)', transform: card.isReversed ? 'rotate(180deg)' : 'none' }} />
                        <span style={{ fontSize: '11px', display: 'block', marginTop: '8px', color: '#6B5B95', fontWeight: '700' }}>{card.isReversed ? '역방향 🙃' : '정방향 🙂'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {((mode === 'online' && pickedCards.length === numToPick) || (mode === 'upload' && imageSrc)) && !interpretation && (
            <div style={{...styles.widgetCard, border: '2px solid #EBE9F5'}}>
              <p style={styles.label}>나의 직관 적어보기 (선택사항 ✍️)</p>
              <textarea rows="3" value={myReading} onChange={(e) => setMyReading(e.target.value)} placeholder="어떤 느낌이 드나요? 자유롭게 먼저 해석해보세요." style={styles.textArea} />
              <button onClick={generateInterpretation} disabled={isInterpreting} style={{ ...styles.primaryBtn, marginTop: '20px', backgroundColor: isInterpreting ? '#999' : '#6B5B95' }}>
                {isInterpreting ? '🔮 우주의 기운 해석 중...' : '✨ AI 타로 마스터에게 물어보기'}
              </button>
            </div>
          )}

          {interpretation && (
            <div style={{...styles.widgetCard, backgroundColor: '#F6F5FA', border: '1px solid #E1DCF2'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <span style={{ fontSize: '20px' }}>🤖</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#5C4B85' }}>타로 마스터의 해석 결과</span>
              </div>
              <p style={styles.detailText}>{interpretation}</p>
              {!isInterpreting && (
                <button onClick={resetTable} style={{...styles.secondaryBtn, marginTop: '20px'}}>🔄 새로운 질문하기</button>
              )}
            </div>
          )}

          {history.length > 0 && !interpretation && (
            <button onClick={() => setCurrentView('history')} style={styles.floatingHistoryBtn}>
              📚 내 프라이빗 기록장 보기 ({history.length})
            </button>
          )}

        </div>
      </div>
    );
  }

  return (
    <div style={styles.background}>
      <div style={styles.mainWrapper}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ ...styles.title, textAlign: 'left' }}>📚 내 타로 일기장</h1>
          <button onClick={() => { setCurrentView('main'); resetTable(); }} style={styles.backBtn}>◀ 돌아가기</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.length === 0 ? (
            <div style={{...styles.widgetCard, textAlign: 'center', padding: '40px 20px', color: '#999'}}>아직 기록된 타로 리딩이 없어요 🥺</div>
          ) : (
            currentRecords.map((record) => (
              <div key={record.id} style={styles.recordCard}>
                <div style={styles.recordHeader} onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.dateTag}>{record.date}</span>
                    <p style={styles.recordQuestion}>Q. {record.question}</p>
                  </div>
                  <button onClick={(e) => handleDeleteRecord(record.id, e)} style={styles.deleteBtn}>🗑️</button>
                </div>
                {expandedId === record.id && (
                  <div style={styles.recordDetails}>
                    {record.cards && record.cards.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'center' }}>
                        {record.cards.map((c, i) => (
                          <div key={i} style={{ textAlign: 'center' }}>
                            <img src={`/cards/card (${c.id}).jpg`} style={{ width: '65px', height: '105px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #FFF', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', transform: c.isReversed ? 'rotate(180deg)' : 'none' }} alt="기록 카드" />
                            <span style={{ fontSize: '10px', display: 'block', color: '#6B5B95', marginTop: '4px', fontWeight:'600' }}>{c.isReversed ? '역 🙃' : '정 🙂'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {record.imageSrc && (
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <img src={record.imageSrc} style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px' }} alt="기록 사진" />
                      </div>
                    )}
                    {record.myReading && (
                      <div style={{...styles.detailBox, backgroundColor: '#FFF'}}>
                        <span style={styles.detailLabel}>나의 직관 기록</span>
                        <p style={styles.detailText}>{record.myReading}</p>
                      </div>
                    )}
                    <div style={{...styles.detailBox, backgroundColor: '#F6F5FA', border: 'none'}}>
                      <span style={{...styles.detailLabel, color: '#6B5B95'}}>🤖 마스터 피드백</span>
                      <p style={styles.detailText}>{record.result}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '24px' }}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.3 : 1 }}>이전</button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#666' }}>{currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.3 : 1 }}>다음</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  background: { backgroundColor: '#F0F2F5', minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '20px', fontFamily: "'Pretendard', sans-serif", color: '#333' },
  mainWrapper: { maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' },
  topNav: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: '40px' },
  userInfoBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFF', padding: '6px 12px', borderRadius: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  profileImg: { width: '28px', height: '28px', borderRadius: '50%' },
  userName: { fontSize: '13px', fontWeight: '700', color: '#444' },
  logoutBtn: { background: 'none', border: 'none', fontSize: '12px', color: '#888', cursor: 'pointer', fontWeight: '600', padding: '0 4px', textDecoration: 'underline' },
  header: { textAlign: 'center', marginBottom: '8px', marginTop: '10px' },
  headerIcon: { fontSize: '32px', marginBottom: '8px' },
  title: { color: '#1A1A1A', fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.03em' },
  subtitle: { color: '#666', fontSize: '14px', margin: 0, fontWeight: '500' },
  modeToggleBox: { display: 'flex', backgroundColor: '#E4E6EB', borderRadius: '16px', padding: '6px', gap: '6px', marginBottom: '8px' },
  modeBtn: { flex: 1, padding: '14px 0', border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' },
  widgetCard: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '28px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' },
  label: { color: '#333', fontSize: '15px', fontWeight: '700', margin: '0 0 12px 0', letterSpacing: '-0.01em' },
  textInput: { width: '100%', boxSizing: 'border-box', padding: '16px', border: 'none', backgroundColor: '#F4F5F9', borderRadius: '16px', fontSize: '15px', outline: 'none', transition: 'background 0.2s ease', fontFamily: 'inherit' },
  textArea: { width: '100%', boxSizing: 'border-box', padding: '16px', border: 'none', backgroundColor: '#F4F5F9', borderRadius: '16px', fontSize: '15px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' },
  fileBox: { border: '2px dashed #DFE2E8', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FAFBFC', cursor: 'pointer' },
  fileButton: { backgroundColor: '#FFF', border: '1px solid #DFE2E8', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#444', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  fileText: { fontSize: '14px', color: '#888', fontWeight: '500' },
  numBtn: { flex: 1, padding: '14px 0', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease' },
  primaryBtn: { backgroundColor: '#6B5B95', color: '#FFF', border: 'none', padding: '18px', borderRadius: '16px', width: '100%', cursor: 'pointer', fontWeight: '700', fontSize: '16px', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(107, 91, 149, 0.2)', transition: 'transform 0.1s ease' },
  secondaryBtn: { backgroundColor: '#F0F2F5', color: '#444', border: 'none', padding: '16px', borderRadius: '16px', width: '100%', cursor: 'pointer', fontWeight: '700', fontSize: '15px', fontFamily: 'inherit' },
  floatingHistoryBtn: { backgroundColor: '#FFF', color: '#555', border: 'none', padding: '18px', borderRadius: '24px', width: '100%', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', marginTop: '8px', fontFamily: 'inherit' },
  backBtn: { backgroundColor: '#FFF', color: '#444', border: 'none', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', fontFamily: 'inherit' },
  rotateBtn: { backgroundColor: '#FFF', border: '1px solid #E4E6EB', padding: '10px 18px', borderRadius: '20px', marginTop: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  recordCard: { backgroundColor: '#FFF', borderRadius: '20px', boxShadow: '0 6px 16px rgba(0,0,0,0.03)', overflow: 'hidden' },
  recordHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  dateTag: { fontSize: '12px', color: '#8B78E6', fontWeight: '700', backgroundColor: '#F0EEF8', padding: '4px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '8px' },
  recordQuestion: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1A1A1A' },
  deleteBtn: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', padding: '8px', opacity: 0.5, marginLeft: '8px' },
  recordDetails: { padding: '0 24px 24px 24px', backgroundColor: '#FFF' },
  detailBox: { backgroundColor: '#F8F9FB', borderRadius: '16px', padding: '20px', marginBottom: '12px' },
  detailLabel: { fontSize: '13px', fontWeight: '800', color: '#666', display: 'block', marginBottom: '10px' },
  detailText: { margin: '0', fontSize: '15px', lineHeight: '1.7', color: '#333', whiteSpace: 'pre-wrap' },
  pageBtn: { padding: '12px 20px', backgroundColor: '#FFF', color: '#333', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
};



