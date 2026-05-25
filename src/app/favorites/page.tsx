"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Star,
  MapPin,
  Trash2,
  RotateCcw,
  Plane,
  Globe,
  Shuffle,
  Sparkles,
  X,
  Folder,
  FolderPlus,
  FolderMinus,
  Archive,
  Plus,
  Check,
  HelpCircle,
  Route,
  ListPlus,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type FolderItem = {
  id: string;
  name: string;
  placeIds: string[];
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "name">("latest");
  const [userId, setUserId] = useState<string | null>(null);
  const [randomItem, setRandomItem] = useState<any | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const randomIntervalRef = useRef<number | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [activeFolderId, setActiveFolderId] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const [showFolderHelp, setShowFolderHelp] = useState(false);
  const [addPlaceFolderId, setAddPlaceFolderId] = useState<string | null>(null);
  const [draggedPlaceId, setDraggedPlaceId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [foldersHydrated, setFoldersHydrated] = useState(false);

  const [toast, setToast] = useState<{ visible: boolean; lastItem: any | null }>({
    visible: false,
    lastItem: null,
  });

  const folderStorageKey = useMemo(() => {
    return `travel-favorite-folders-${userId ?? "guest"}`;
  }, [userId]);

  // 1. 초기 데이터 로드: 로그인 확인 후 서버(API)에서 데이터 호출 (B: 폴더 로컬스토리지 로드 기능 포함)
  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);

      const storageKey = `travel-favorite-folders-${uid ?? "guest"}`;
      const savedFolders = window.localStorage.getItem(storageKey);

      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch {
          setFolders([]);
        }
      } else {
        setFolders([]);
      }

      setFoldersHydrated(true);

      if (uid) {
        fetch(`${API_URL}/favorites/${uid}`)
          .then((r) => r.json())
          .then((data) => {
            const mapped = data.map((f: any) => ({
              name: f.places?.name ?? f.place_id,
              address: f.places?.address ?? "",
              placeId: f.place_id,
            }));
            setFavorites(mapped);
          })
          .catch((err) => {
            console.error("데이터 로딩 실패:", err);
            setFavorites([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!foldersHydrated) return;
    window.localStorage.setItem(folderStorageKey, JSON.stringify(folders));
  }, [folders, folderStorageKey, foldersHydrated]);

  const activeFolder = useMemo(() => {
    return folders.find((folder) => folder.id === activeFolderId) ?? null;
  }, [folders, activeFolderId]);

  const addPlaceFolder = useMemo(() => {
    return folders.find((folder) => folder.id === addPlaceFolderId) ?? null;
  }, [folders, addPlaceFolderId]);

  const visibleFavorites = useMemo(() => {
    if (activeFolderId === "all") return favorites;
    if (!activeFolder) return [];
    return favorites.filter((item) => activeFolder.placeIds.includes(item.placeId));
  }, [favorites, activeFolder, activeFolderId]);

  // 2. 정렬 기능 (B: 선택된 폴더 내의 장소들을 기준으로 정렬하도록 확장됨)
  const sortedFavorites = useMemo(() => {
    let result = [...visibleFavorites];
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else {
      result.reverse();
    }
    return result;
  }, [visibleFavorites, sortBy]);

  const randomButtonDisabled = isShuffling || visibleFavorites.length === 0;

  const getPlaceFolders = (placeId: string) => {
    return folders.filter((folder) => folder.placeIds.includes(placeId));
  };

  const handleCreateFolder = () => {
    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      setFolderError("폴더이름을 입력해주세요.");
      return;
    }

    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      name: trimmedName,
      placeIds: [],
    };

    setFolders((prev) => [...prev, newFolder]);
    setActiveFolderId(newFolder.id);
    setNewFolderName("");
    setFolderError("");
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
    if (activeFolderId === folderId) setActiveFolderId("all");
    if (addPlaceFolderId === folderId) setAddPlaceFolderId(null);
  };

  const handleMovePlaceToFolder = (placeId: string, folderId: string) => {
    if (folderId === "all") {
      setFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          placeIds: folder.placeIds.filter((id) => id !== placeId),
        }))
      );
      return;
    }

    setFolders((prev) =>
      prev.map((folder) => {
        const withoutPlace = folder.placeIds.filter((id) => id !== placeId);

        if (folder.id !== folderId) {
          return { ...folder, placeIds: withoutPlace };
        }

        return {
          ...folder,
          placeIds: [...withoutPlace, placeId],
        };
      })
    );
  };

  const handleTogglePlaceInFolder = (folderId: string, placeId: string) => {
    setFolders((prev) =>
      prev.map((folder) => {
        if (folder.id !== folderId) return folder;

        const alreadyAdded = folder.placeIds.includes(placeId);

        return {
          ...folder,
          placeIds: alreadyAdded
            ? folder.placeIds.filter((id) => id !== placeId)
            : [...folder.placeIds, placeId],
        };
      })
    );
  };

  const handleDropToFolder = (folderId: string) => {
    if (!draggedPlaceId) return;
    handleMovePlaceToFolder(draggedPlaceId, folderId);
    setDraggedPlaceId(null);
    setDragOverFolderId(null);
  };

  // 폴더 순서 변경 핸들러 추가
  const handleMoveFolderOrder = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === folders.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updatedFolders = [...folders];
    
    // 두 폴더의 위치를 교환(Swap)
    const temp = updatedFolders[index];
    updatedFolders[index] = updatedFolders[targetIndex];
    updatedFolders[targetIndex] = temp;

    setFolders(updatedFolders);
  };

  const handleRandomRecommend = () => {
    if (visibleFavorites.length === 0 || isShuffling) return;

    if (randomIntervalRef.current) {
      window.clearInterval(randomIntervalRef.current);
    }

    setIsShuffling(true)
    setShowRandomModal(true);

    let shuffleCount = 0;
    const maxShuffleCount = 14;

    randomIntervalRef.current = window.setInterval(() => {
      const randomIndex = Math.floor(Math.random() * visibleFavorites.length);
      setRandomItem(visibleFavorites[randomIndex]);
      shuffleCount += 1;

      if (shuffleCount >= maxShuffleCount) {
        if (randomIntervalRef.current) {
          window.clearInterval(randomIntervalRef.current);
          randomIntervalRef.current = null;
        }

        const finalIndex = Math.floor(Math.random() * visibleFavorites.length);
        setRandomItem(visibleFavorites[finalIndex]);
        setIsShuffling(false);
      }
    }, 90);
  };

  const handleCloseRandomModal = () => {
    if (randomIntervalRef.current) {
      window.clearInterval(randomIntervalRef.current);
      randomIntervalRef.current = null;
    }

    setShowRandomModal(false);
    setIsShuffling(false);
  };

  // 3. 삭제 기능: UI에서 먼저 제거 후 서버에 DELETE 요청 (B: 속한 폴더 내부 및 랜덤 모달 상태 동기화 로직 추가)
  const handleDelete = (item: any) => {
    const updated = favorites.filter((f) => f.placeId !== item.placeId);
    setToast({ visible: true, lastItem: item });
    setFavorites(updated);

    setFolders((prev) =>
      prev.map((folder) => ({
        ...folder,
        placeIds: folder.placeIds.filter((id) => id !== item.placeId),
      }))
    );

    if (randomItem?.placeId === item.placeId) {
      setRandomItem(null);
      setShowRandomModal(false);
      setIsShuffling(false);
    }

    if (userId && item.placeId) {
      fetch(`${API_URL}/favorites/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, place_id: item.placeId }),
      });
    }
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  // 4. 실행 취소(복구): UI에 다시 추가 후 서버에 POST 요청
  const handleUndo = () => {
    if (!toast.lastItem) return;
    const restored = [...favorites, toast.lastItem];
    setFavorites(restored);

    if (userId && toast.lastItem.placeId) {
      fetch(`${API_URL}/favorites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, place_id: toast.lastItem.placeId }),
      });
    }
    setToast({ visible: false, lastItem: null });
  };

  return (
    <div className="min-h-screen bg-[#F0E8DE] text-slate-950 font-sans tracking-tight relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes scan { 0% { left: -10%; opacity: 0; } 50% { opacity: 1; } 100% { left: 110%; opacity: 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes plane-fly { 0% { transform: translateX(-20px) translateY(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(300px) translateY(-100px); opacity: 0; } }
        @keyframes globe-rotate { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes random-pop { 0% { transform: scale(0.84) translateY(24px); opacity: 0; } 70% { transform: scale(1.04) translateY(-4px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes random-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes random-shine { 0% { transform: translateX(-130%) rotate(18deg); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateX(150%) rotate(18deg); opacity: 0; } }
        @keyframes sparkle-spin { 0% { transform: rotate(0deg) scale(1); opacity: 0.55; } 50% { transform: rotate(180deg) scale(1.22); opacity: 1; } 100% { transform: rotate(360deg) scale(1); opacity: 0.55; } }
        @keyframes shuffle-bounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-5px) rotate(-8deg); } 60% { transform: translateY(3px) rotate(7deg); } }
        @keyframes folder-panel-in { 0% { transform: translateX(18px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes list-soft-in { 0% { transform: translateY(14px); opacity: 0; filter: blur(3px); } 100% { transform: translateY(0); opacity: 1; filter: blur(0); } }
        @keyframes folder-glow { 0%, 100% { box-shadow: 0 18px 45px rgba(92,69,57,0.08); } 50% { box-shadow: 0 24px 60px rgba(92,69,57,0.14); } }
        @keyframes sort-panel-pulse { 0%, 100% { box-shadow: 0 6px 16px rgba(31,41,55,0.06); } 50% { box-shadow: 0 12px 28px rgba(31,41,55,0.11); } }
        @keyframes sort-text-pop { 0% { transform: scale(0.96); } 60% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes add-place-glow { 0%, 100% { box-shadow: 0 8px 18px rgba(79,139,105,0.04); } 50% { box-shadow: 0 14px 30px rgba(37,99,235,0.14); } }
        @keyframes add-place-icon { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-2px) rotate(-8deg); } }
        @keyframes add-modal-card { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

        .animate-scan { animation: scan 2s linear infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-plane { animation: plane-fly 3s infinite ease-in-out; }
        .animate-globe { animation: globe-rotate 4s linear infinite; }
        .animate-random-pop { animation: random-pop 0.52s cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .animate-random-float { animation: random-float 3s ease-in-out infinite; }
        .animate-random-shine { animation: random-shine 1.45s ease-in-out infinite; }
        .animate-sparkle-spin { animation: sparkle-spin 2.4s linear infinite; }
        .animate-shuffle-bounce { animation: shuffle-bounce 0.52s ease-in-out infinite; }
        .animate-folder-panel-in { animation: folder-panel-in 0.34s ease-out both; }
        .animate-list-soft-in { animation: list-soft-in 0.38s ease-out both; }
        .animate-folder-glow { animation: folder-glow 3s ease-in-out infinite; }
        .animate-sort-panel-pulse { animation: sort-panel-pulse 2.8s ease-in-out infinite; }
        .animate-sort-text-pop { animation: sort-text-pop 0.24s ease-out both; }
        .animate-add-place-glow { animation: add-place-glow 2.2s ease-in-out infinite; }
        .animate-add-place-icon { animation: add-place-icon 1.2s ease-in-out infinite; }
        .animate-add-modal-card { animation: add-modal-card 0.24s ease-out both; }

        .folder-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CDBBA8 rgba(249, 244, 238, 0.72);
        }

        .folder-scroll::-webkit-scrollbar { width: 10px; }
        .folder-scroll::-webkit-scrollbar-track {
          background: rgba(249, 244, 238, 0.72);
          border-radius: 999px;
          margin: 10px 0;
        }
        .folder-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #DCCDBC 0%, #BFA994 100%);
          border: 3px solid rgba(249, 244, 238, 0.92);
          border-radius: 999px;
        }
        .folder-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #CBB7A2 0%, #A98F7B 100%);
        }
        .folder-scroll::-webkit-scrollbar-corner { background: transparent; }

        .map-paper {
          background:
            radial-gradient(circle at 18% 16%, rgba(255,255,255,0.74), transparent 28%),
            radial-gradient(circle at 82% 20%, rgba(221,183,150,0.34), transparent 30%),
            radial-gradient(circle at 68% 82%, rgba(97,126,110,0.16), transparent 32%),
            linear-gradient(135deg, #f6eee5 0%, #eadfd4 50%, #f5eadf 100%);
        }

        .lens {
          box-shadow:
            inset 10px 10px 26px rgba(92, 69, 57, 0.18),
            inset -10px -10px 22px rgba(255, 255, 255, 0.72),
            0 26px 70px rgba(72, 50, 42, 0.24);
        }

        .photo-rich {
          filter: saturate(1.13) contrast(1.07) brightness(0.98);
        }
      `}</style>

      <div className="fixed inset-0 map-paper pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none z-[1]">
        <svg className="w-full h-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="mainGrid" width="96" height="96" patternUnits="userSpaceOnUse">
              <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#b9aaa0" strokeWidth="1.4" opacity="0.46" />
            </pattern>
            <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#5b4136" floodOpacity="0.18" />
            </filter>
          </defs>

          <rect width="1600" height="1000" fill="url(#mainGrid)" />

          <g opacity="0.3" fill="none" stroke="#9a887d" strokeLinecap="round">
            <path d="M-70,110 C25,80 36,155 95,118 C145,88 154,40 220,58 C280,75 270,140 352,116" strokeWidth="2" />
            <path d="M-60,770 C38,720 80,832 160,778 C248,718 250,650 365,686 C445,710 452,805 560,760" strokeWidth="2" />
            <path d="M1280,36 C1362,112 1478,26 1532,92 C1590,165 1478,198 1538,250 C1592,298 1665,248 1692,330" strokeWidth="2" />
            <path d="M1215,870 C1305,815 1372,906 1448,850 C1520,796 1585,812 1668,748" strokeWidth="2" />
          </g>

          <g filter="url(#routeShadow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-70 235 C55 235 170 235 275 235 C365 235 420 290 420 380 C420 468 430 535 407 594 C386 648 356 674 316 692 C298 700 281 706 268 713 C210 734 172 782 118 806 C58 833 -2 860 -60 886" stroke="#9C877F" strokeWidth="16" />
            <path d="M460 104 C555 104 612 154 650 225 C684 288 716 353 752 415 C780 468 830 498 890 498 C970 498 1050 498 1125 498 C1180 498 1218 475 1248 430 C1278 386 1308 339 1338 294 C1376 236 1430 218 1496 218 C1560 218 1625 218 1690 218" stroke="#B88A62" strokeWidth="16" />
            <path d="M570 1010 C604 940 632 884 662 835 C690 780 732 752 792 752 C838 752 885 752 930 752 C985 752 1024 724 1048 675 C1068 633 1086 595 1106 560 C1136 500 1185 470 1252 470 C1302 470 1360 470 1410 470 C1505 470 1600 470 1690 470" stroke="#8C6F5A" strokeWidth="16" />
          </g>

          <g fill="#fffaf6" stroke="#3F2E2A" strokeWidth="7">
            <circle cx="420" cy="235" r="18" />
            <circle cx="268" cy="713" r="18" />
            <circle cx="1248" cy="430" r="18" />
            <circle cx="1410" cy="470" r="18" />
            <circle cx="1496" cy="218" r="18" />
            <circle cx="792" cy="752" r="18" />
          </g>

          <g opacity="0.24" stroke="#8c7b72" strokeWidth="2" fill="none">
            <path d="M235 130 H420 M235 130 V315" />
            <path d="M1250 105 H1455 M1455 105 V305" />
            <path d="M1125 835 C1185 800 1238 845 1294 812 C1356 776 1412 818 1470 790 C1528 762 1580 786 1645 748" />
            <path d="M1175 888 C1230 858 1286 902 1342 868 C1396 836 1448 872 1505 842 C1565 810 1618 834 1685 798" />
          </g>
        </svg>
      </div>

      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <Star size={152} className="absolute left-[6%] top-[32%] rotate-[-14deg] fill-[#D8A63A] text-[#B8861D] opacity-30 drop-shadow-[0_18px_34px_rgba(86,64,28,0.18)]" strokeWidth={1.35} />
        <Star size={124} className="absolute right-[15%] bottom-[15%] rotate-[10deg] fill-[#E7BE63] text-[#B8861D] opacity-28 drop-shadow-[0_18px_34px_rgba(86,64,28,0.16)]" strokeWidth={1.35} />
        <Star size={118} className="absolute left-[37%] bottom-[18%] rotate-[-8deg] fill-[#C89535] text-[#8C6F5A] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
        <Star size={194} className="absolute right-[32%] top-[19%] rotate-[18deg] fill-[#F0C969] text-[#B88A62] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
      </div>

      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <div className="absolute left-[19%] top-[11%] h-64 w-64 rounded-full border-[10px] border-[#9C877F]/85 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=700&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-[#f4e6dc]/12" />
        </div>
        <div className="absolute left-[16.8%] top-[42%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">여행지</div>
        <div className="absolute left-[29.2%] top-[45%] flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6F5A] shadow-[0_18px_45px_rgba(140,111,90,0.35)]">
          <MapPin size={38} className="text-white" strokeWidth={2.6} />
        </div>

        <div className="absolute right-[3.4%] top-[14%] h-[350px] w-[350px] rounded-full border-[16px] border-[#c4b0a5]/90 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-84" />
          <div className="absolute inset-0 bg-[#f1ded3]/24" />
          <div className="absolute inset-[64px] rounded-full border-[16px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute right-[20%] top-[20%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">호텔</div>

        <div className="absolute left-[46%] bottom-[4.5%] h-56 w-56 rounded-full border-[10px] border-[#c4b0a5]/90 bg-white/14 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-86" />
          <div className="absolute inset-0 bg-[#f4e6dc]/18" />
          <div className="absolute inset-[48px] rounded-full border-[12px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute left-[48.5%] bottom-[25%] text-[64px] font-black tracking-tighter text-[#7e7773]/30">식당</div>

        <div className="absolute right-[2%] top-[41%] h-24 w-24 rounded-full bg-[#9C877F]/36 blur-sm" />
        <div className="absolute left-[24%] bottom-[2%] h-28 w-28 rounded-full bg-[#9C877F]/26 blur-sm" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-[3] bg-gradient-to-b from-[#F0E8DE]/58 via-[#F0E8DE]/18 to-[#F0E8DE]/68" />
      <div className="fixed left-1/2 top-[92px] z-[4] h-60 w-[760px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[#f3ebe2]/72 blur-3xl pointer-events-none" />

      <nav className="relative z-20 flex items-center p-6 px-12 border-b border-[#D7D3C8] bg-[#EFECE5]/86 backdrop-blur-md sticky top-0">
        <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900" style={{ textDecoration: "none" }}>
          여행 돋보기
        </Link>
      </nav>

      <main className="relative z-10 max-w-[1600px] mx-auto w-full flex-1 p-8 lg:p-12">
        <div className="relative flex flex-col items-center text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-[#D8A63A]/35 bg-white/72 px-6 py-3 shadow-[0_18px_45px_rgba(92,69,57,0.10)] backdrop-blur-md">
            <h1 className="text-3xl font-black text-[#1f2937] tracking-tighter">
              {activeFolderId === "all" ? "즐겨찾기 목록" : activeFolder?.name}
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-white/96 px-4 py-2 rounded-full border border-[#F2F1EC] shadow-sm">
            <Star size={16} className="fill-amber-400 text-amber-500" />
            <span className="text-sm font-bold text-slate-700">
              {activeFolderId === "all" ? "전체 즐겨찾기" : `${activeFolder?.name ?? "폴더"} 즐겨찾기`} : {visibleFavorites.length}개
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1152px)_292px] gap-8 items-start justify-center">
          <section>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-40 bg-[#FEFDFC]/94 backdrop-blur-md rounded-[48px] border border-[#F2F1EC] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
                  <div className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-scan" />
                </div>
                <div className="relative mb-10">
                  <div className="absolute inset-0 rounded-full border-4 border-[#4F8B69]/20 animate-pulse-ring" />
                  <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl relative z-10 rotate-3 overflow-hidden">
                    <Globe size={40} className="text-white animate-globe" />
                  </div>
                  <Plane size={24} className="text-[#4F8B69] absolute -right-12 -top-4 animate-plane" />
                </div>
                <div className="space-y-4 text-center px-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">기록을 불러오고 있습니다</h2>
                </div>
              </div>
            ) : (
              <>
                {favorites.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 xl:translate-x-[166px]">
                    <div className="relative flex items-center bg-white/96 backdrop-blur-md border border-[#F2F1EC] rounded-full p-1.5 shadow-sm animate-sort-panel-pulse overflow-hidden">
                      <div className={`absolute top-1.5 bottom-1.5 w-[92px] rounded-full bg-slate-800 shadow-md transition-transform duration-300 ease-out ${sortBy === "latest" ? "translate-x-0" : "translate-x-[92px]"}`} />
                      <button onClick={() => setSortBy("latest")} className={`relative z-10 w-[92px] py-2 rounded-full text-[13px] font-black transition-colors duration-300 ${sortBy === "latest" ? "text-white animate-sort-text-pop" : "text-slate-400 hover:text-slate-600"}`}>최신순</button>
                      <button onClick={() => setSortBy("name")} className={`relative z-10 w-[92px] py-2 rounded-full text-[13px] font-black transition-colors duration-300 ${sortBy === "name" ? "text-white animate-sort-text-pop" : "text-slate-400 hover:text-slate-600"}`}>가나다순</button>
                    </div>

                    <button
                      onClick={handleRandomRecommend}
                      disabled={randomButtonDisabled}
                      title={visibleFavorites.length === 0 ? "이 폴더에는 추천할 장소가 없습니다." : "랜덤 장소 추천"}
                      className={`relative overflow-hidden flex items-center gap-2 rounded-full border px-6 py-3 text-[13px] font-black shadow-sm transition-all ${
                        visibleFavorites.length === 0
                          ? "cursor-not-allowed border-[#E8DED2] bg-[#EFE4D8] text-[#9C877F] opacity-90"
                          : isShuffling
                            ? "cursor-wait border-[#D8A63A]/45 bg-[#1f2937] text-white shadow-[0_18px_45px_rgba(31,41,55,0.22)]"
                            : "cursor-pointer border-[#D8A63A]/45 bg-[#1f2937] text-white shadow-[0_18px_45px_rgba(31,41,55,0.22)] hover:-translate-y-1 hover:bg-slate-950"
                      }`}
                    >
                      {visibleFavorites.length > 0 && (
                        <span className="absolute inset-y-[-30%] left-0 w-12 bg-white/25 blur-md animate-random-shine" />
                      )}
                      <Shuffle size={16} className={isShuffling ? "animate-shuffle-bounce" : ""} />
                      {visibleFavorites.length === 0 ? "추천할 장소 없음" : isShuffling ? "추천 중..." : "랜덤 장소 추천"}
                      <Route size={15} className={visibleFavorites.length === 0 ? "text-[#A98F7B]" : "text-[#E7D6C6]"} />
                    </button>
                  </div>
                )}

                <div key={activeFolderId} className="animate-list-soft-in">
                  {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#FEFDFC]/94 backdrop-blur-md rounded-[40px] border border-[#F2F1EC] shadow-sm">
                      <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
                        <Star size={40} className="text-[#D1CFC8]" />
                      </div>
                      <p className="text-xl font-bold text-slate-400">저장된 장소가 없습니다.</p>
                      <Link href="/" className="mt-8 bg-slate-800 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-900">장소 검색하러 가기</Link>
                    </div>
                  ) : visibleFavorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#FEFDFC]/94 backdrop-blur-md rounded-[40px] border border-[#F2F1EC] shadow-sm">
                      <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
                        <Folder size={40} className="text-[#D1CFC8]" />
                      </div>
                      <p className="text-xl font-bold text-slate-400">이 폴더에 저장된 장소가 없습니다.</p>
                      <p className="mt-2 text-sm font-bold text-slate-400">장소 카드를 드래그하거나 장소추가 버튼을 사용해보세요.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {sortedFavorites.map((item, index) => {
                        const itemFolders = getPlaceFolders(item.placeId);
                        const visibleFolder = itemFolders[0];
                        const extraFolderCount = Math.max(0, itemFolders.length - 1);

                        return (
                          <div
                            key={`${item.placeId}-${index}`}
                            draggable
                            onDragStart={() => setDraggedPlaceId(item.placeId)}
                            onDragEnd={() => {
                              setDraggedPlaceId(null);
                              setDragOverFolderId(null);
                            }}
                            className={`group bg-[#FEFDFC]/96 backdrop-blur-md p-8 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-[#F2F1EC] hover:shadow-[0_25px_50px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden hover:-translate-y-2 cursor-grab active:cursor-grabbing min-h-[322px] ${draggedPlaceId === item.placeId ? "scale-[0.98] opacity-60 ring-4 ring-[#D8A63A]/20" : ""}`}
                          >
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#F9F7F2] rounded-full group-hover:scale-[3.5] transition-transform duration-700 ease-in-out opacity-50" />
                            <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-[#F9F7F2] rounded-2xl text-[#4F8B69] group-hover:bg-slate-800 group-hover:text-white transition-all"><MapPin size={20} /></div>
                                <button onClick={() => handleDelete(item)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                              </div>
                              <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{item.name}</h3>
                              <p className="text-[14px] text-slate-400 font-medium line-clamp-2 min-h-[40px]">{item.address}</p>

                              <div className="mt-5 flex items-center gap-2">
                                {visibleFolder ? (
                                  <>
                                    <span className="inline-flex max-w-[170px] items-center gap-1.5 rounded-full border border-[#E8DED2] bg-[#F3ECE3] px-3 py-1.5 text-[11px] font-black text-[#7A665A]">
                                      <Folder size={12} />
                                      <span className="truncate">{visibleFolder.name}</span>
                                    </span>
                                    {extraFolderCount > 0 && (
                                      <span className="rounded-full bg-slate-900 px-2.5 py-1.5 text-[11px] font-black text-white">+{extraFolderCount}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0E5D8] bg-[#F9F7F2] px-3 py-1.5 text-[11px] font-black text-slate-400">
                                    <Archive size={12} />
                                    미분류
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-10 relative z-10">
                              <Link href={`/review?q=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.placeId)}&address=${encodeURIComponent(item.address)}&from=favorites`} className="w-full bg-slate-800 text-white py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center hover:bg-slate-950 transition-all">상세 분석 리포트 보기</Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="relative z-10 xl:sticky xl:top-[280px] xl:mt-30 xl:translate-x-16 2xl:translate-x-24">
            <div className="animate-folder-panel-in rounded-[30px] border border-[#E4D8CA] bg-[#F4ECE2]/94 p-4 shadow-[0_18px_45px_rgba(92,69,57,0.10)] backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9C877F]">장소분류</p>
                  <h2 className="text-lg font-black tracking-tighter text-slate-900">폴더</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowFolderHelp(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E9DED2] text-[#7A665A] transition-all hover:bg-[#dfd1c2] hover:text-slate-900" title="폴더 도움말">
                    <HelpCircle size={18} />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E9DED2] text-[#7A665A]">
                    <Folder size={19} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveFolderId("all")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverFolderId("all");
                }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={() => handleDropToFolder("all")}
                className={`mb-3 flex w-full items-center justify-between rounded-[20px] border p-3.5 text-left transition-all duration-300 ${
                  activeFolderId === "all"
                    ? "border-[#D8C9B8] bg-[#FEFDFC] shadow-[0_12px_28px_rgba(92,69,57,0.10)]"
                    : "border-[#E8DED2] bg-[#F9F4EE]/76 hover:bg-[#FEFDFC]"
                } ${dragOverFolderId === "all" ? "scale-[1.02] border-[#D8A63A] bg-[#FFF8E8] animate-folder-glow" : ""}`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFE4D8] text-[#8C6F5A]">
                    <Archive size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-black text-slate-800">전체</span>
                    <span className="block text-[11px] font-bold text-[#9C877F]">모든 장소 보기</span>
                  </span>
                </span>
                <span className="rounded-full bg-[#EFE4D8] px-2.5 py-1 text-[11px] font-black text-[#7A665A]">{favorites.length}</span>
              </button>

              <div className="relative mb-4">
                <div className="pointer-events-none absolute left-0 right-3 top-0 z-10 h-6 rounded-t-[18px] bg-gradient-to-b from-[#F4ECE2] to-transparent" />
                <div className="pointer-events-none absolute bottom-0 left-0 right-3 z-10 h-7 rounded-b-[18px] bg-gradient-to-t from-[#F4ECE2] to-transparent" />

                <div className="folder-scroll max-h-[360px] space-y-2 overflow-y-auto pr-2 py-2 transition-all duration-300">
                  {folders.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-[#D8C9B8] bg-[#F9F4EE]/74 p-5 text-center">
                      <Folder size={30} className="mx-auto mb-3 text-[#B9AAA0]" />
                      <p className="text-sm font-black text-slate-500">폴더가 없습니다.</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">아래에서 생성하세요.</p>
                    </div>
                  ) : (
                    folders.map((folder, index) => (
                      <div
                        key={folder.id}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverFolderId(folder.id);
                        }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={() => handleDropToFolder(folder.id)}
                        className={`group/item relative rounded-[22px] border p-3 transition-all duration-500 ease-in-out transform ${
                          activeFolderId === folder.id
                            ? "border-[#D8C9B8] bg-[#FEFDFC] shadow-[0_12px_28px_rgba(92,69,57,0.10)]"
                            : "border-[#E8DED2] bg-[#F9F4EE]/76 hover:bg-[#FEFDFC]"
                        } ${dragOverFolderId === folder.id ? "scale-[1.02] border-[#D8A63A] bg-[#FFF8E8] animate-folder-glow" : ""}`}
                      >
                        {/* 폴더 순서 변경 버튼 패널 추가 */}
                        <div className="absolute right-3 top-3 flex flex-col gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 bg-white/90 p-1 rounded-xl shadow-sm border border-slate-100 z-10">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveFolderOrder(index, "up");
                            }}
                            className={`p-1 rounded-md transition-colors ${index === 0 ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                            title="위로 이동"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === folders.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveFolderOrder(index, "down");
                            }}
                            className={`p-1 rounded-md transition-colors ${index === folders.length - 1 ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}
                            title="아래로 이동"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <button onClick={() => setActiveFolderId(folder.id)} className="flex w-full items-center justify-between text-left pr-6">
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EFE4D8] text-[#7A665A]">
                              <Folder size={18} />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-slate-800">{folder.name}</span>
                              <span className="block text-[11px] font-bold text-[#9C877F]">{folder.placeIds.length}개 장소</span>
                            </span>
                          </span>
                          {activeFolderId === folder.id && <Check size={16} className="text-[#8C6F5A] shrink-0" />}
                        </button>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setAddPlaceFolderId(folder.id)}
                            className="group/add relative overflow-hidden flex items-center justify-center gap-1.5 rounded-2xl border border-[#D9E9DF] bg-[#F2FBF6] px-3 py-2 text-[11px] font-black text-[#4F8B69] transition-all hover:-translate-y-0.5 hover:border-[#86C8E8] hover:bg-[#EAF7FF] hover:text-[#2563EB] hover:animate-add-place-glow"
                          >
                            <span className="absolute inset-y-0 left-0 w-8 -translate-x-10 bg-white/55 blur-md transition-transform duration-500 group-hover/add:translate-x-28" />
                            <ListPlus size={13} className="relative group-hover/add:animate-add-place-icon" />
                            <span className="relative">장소추가</span>
                          </button>

                          <button onClick={() => handleDeleteFolder(folder.id)} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#F0E7DD] px-3 py-2 text-[11px] font-black text-[#9C877F] transition-all hover:bg-red-50 hover:text-red-500">
                            <FolderMinus size={13} />
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E8DED2] bg-[#FEFDFC]/72 p-3.5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <FolderPlus size={16} className="text-[#8C6F5A]" />
                  <p className="text-sm font-black text-slate-800">폴더 생성</p>
                </div>

                <input
                  value={newFolderName}
                  onChange={(event) => {
                    setNewFolderName(event.target.value);
                    if (folderError) setFolderError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleCreateFolder();
                  }}
                  placeholder="예: 제주 맛집"
                  className={`mb-2 w-full rounded-2xl border bg-[#FEFDFC] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 ${
                    folderError
                      ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
                      : "border-[#E8DED2] focus:border-[#B88A62]/50 focus:ring-4 focus:ring-[#B88A62]/10"
                  }`}
                />

                {folderError && <p className="mb-3 px-1 text-xs font-black text-red-500">{folderError}</p>}

                <button onClick={handleCreateFolder} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8C6F5A] px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(140,111,90,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#725946]">
                  <Plus size={16} />
                  생성
                </button>
              </div>

              {draggedPlaceId && (
                <div className="mt-3 rounded-[20px] border border-[#D8A63A]/35 bg-[#FFF8E8] px-4 py-3 text-center text-xs font-black text-[#8C6F5A] shadow-sm">
                  폴더 위에 놓으면 이동됩니다
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {showRandomModal && randomItem && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]" onClick={handleCloseRandomModal} />

          <div className="relative w-full max-w-xl animate-random-pop overflow-hidden rounded-[40px] border border-white/70 bg-[#FEFDFC]/96 p-8 shadow-[0_35px_90px_rgba(31,41,55,0.28)]">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#D8A63A]/24 blur-2xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#4F8B69]/18 blur-2xl" />
            <div className="absolute inset-x-8 top-0 h-1 overflow-hidden rounded-full bg-slate-100">
              <div className="absolute top-0 h-full w-28 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan" />
            </div>

            <button type="button" onClick={handleCloseRandomModal} className="absolute right-5 top-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-all hover:scale-105 hover:text-slate-900">
              <X size={18} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="relative mb-7 animate-random-float">
                <div className="absolute inset-0 rounded-full border-4 border-[#D8A63A]/25 animate-pulse-ring" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] bg-slate-900 shadow-2xl">
                  {isShuffling ? <Shuffle size={38} className="text-white animate-shuffle-bounce" /> : <MapPin size={38} className="text-white" />}
                </div>
              </div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D8A63A]/35 bg-white/78 px-4 py-2 text-[12px] font-black text-[#8C6F5A] shadow-sm">                
                오늘의 랜덤 추천
              </div>

              <h2 className={`text-3xl font-black tracking-tighter text-slate-900 transition-all duration-200 ${isShuffling ? "scale-95 blur-[1px] opacity-70" : "scale-100 blur-0 opacity-100"}`}>
                {randomItem.name}
              </h2>

              <p className="mt-3 min-h-[44px] text-sm font-bold leading-relaxed text-slate-500">
                {randomItem.address || "주소 정보가 없습니다."}
              </p>

              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                <button onClick={handleRandomRecommend} disabled={isShuffling} className="flex items-center justify-center gap-2 rounded-2xl border border-[#F2F1EC] bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:bg-[#F9F7F2] disabled:cursor-wait disabled:opacity-70">
                  <Shuffle size={16} className={isShuffling ? "animate-shuffle-bounce" : ""} />
                  다시 추천
                </button>

                <Link href={`/review?q=${encodeURIComponent(randomItem.name)}&id=${encodeURIComponent(randomItem.placeId)}&address=${encodeURIComponent(randomItem.address)}&from=favorites`} className={`flex items-center justify-center rounded-2xl bg-slate-800 px-5 py-4 text-sm font-black text-white shadow-[0_14px_35px_rgba(31,41,55,0.24)] transition-all hover:-translate-y-1 hover:bg-slate-950 ${isShuffling ? "pointer-events-none opacity-60" : ""}`}>
                  상세 분석 리포트 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFolderHelp && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]" onClick={() => setShowFolderHelp(false)} />

          <div className="relative w-full max-w-md animate-random-pop rounded-[34px] border border-white/70 bg-[#FEFDFC]/96 p-7 shadow-[0_35px_90px_rgba(31,41,55,0.24)]">
            <button type="button" onClick={() => setShowFolderHelp(false)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-all hover:scale-105 hover:text-slate-900">
              <X size={18} />
            </button>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFE4D8] text-[#7A665A]">
              <HelpCircle size={26} />
            </div>

            <h2 className="text-2xl font-black tracking-tighter text-slate-900">폴더 사용법</h2>

            <div className="mt-5 space-y-3 text-sm font-bold leading-relaxed text-slate-500">
              <p>폴더에 마우스를 올리면(Hover) 우측 상단에 순서 변경 단추(▲/▼)가 나타납니다. 클릭하여 자연스럽게 순서를 조정할 수 있습니다.</p>
              <p>장소 카드를 드래그해서 원하는 폴더 위에 놓으면 해당 폴더로 이동됩니다.</p>
              <p>각 폴더의 장소추가 버튼을 누르면 목록에서 직접 장소를 선택할 수 있습니다.</p>
              <p>장소를 “전체” 위에 놓으면 폴더 지정이 해제되어 미분류 상태가 됩니다.</p>
              <p>장소 카드에는 폴더 이름이 하나만 표시되고, 여러 폴더에 들어간 경우 +숫자로 정리됩니다.</p>
            </div>

            <button onClick={() => setShowFolderHelp(false)} className="mt-7 w-full rounded-2xl bg-slate-800 px-5 py-4 text-sm font-black text-white transition-all hover:bg-slate-950">
              확인
            </button>
          </div>
        </div>
      )}

      {addPlaceFolder && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-[3px]" onClick={() => setAddPlaceFolderId(null)} />

          <div className="relative w-full max-w-2xl animate-random-pop overflow-hidden rounded-[36px] border border-white/70 bg-[#FEFDFC]/96 p-7 shadow-[0_35px_90px_rgba(31,41,55,0.24)]">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#4F8B69]/16 blur-2xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#86C8E8]/16 blur-2xl" />

            <button
              type="button"
              onClick={() => setAddPlaceFolderId(null)}
              className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition-all hover:scale-105 hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 pr-12">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8DED2] text-[#4F8B69] shadow-sm">
                  <ListPlus size={25} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#4F8B69]">장소 추가하기</p>
                  <h2 className="text-2xl font-black tracking-tighter text-slate-900">{addPlaceFolder.name} 장소추가</h2>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#E8DED2] bg-[#F9F4EE]/70 p-3">
                <div className="folder-scroll max-h-[430px] space-y-3 overflow-y-auto pr-2">
                  {favorites.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center rounded-[24px] bg-white/70 text-center">
                      <Star size={36} className="mb-3 text-[#D1CFC8]" />
                      <p className="text-sm font-black text-slate-400">추가할 즐겨찾기 장소가 없습니다.</p>
                    </div>
                  ) : (
                    favorites.map((place, index) => {
                      const selected = addPlaceFolder.placeIds.includes(place.placeId);

                      return (
                        <button
                          key={`${place.placeId}-${index}`}
                          type="button"
                          onClick={() => handleTogglePlaceInFolder(addPlaceFolder.id, place.placeId)}
                          className={`animate-add-modal-card flex w-full items-start gap-3 rounded-[24px] border p-4 text-left transition-all hover:-translate-y-0.5 ${
                            selected
                              ? "border-[#86C8E8]/60 bg-[#EAF7FF] shadow-[0_12px_30px_rgba(37,99,235,0.10)]"
                              : "border-[#E8DED2] bg-white/78 hover:border-[#BEE6CC] hover:bg-[#F2FBF6]"
                          }`}
                          style={{ animationDelay: `${Math.min(index * 24, 180)}ms` }}
                        >
                          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${
                            selected ? "bg-[#2563EB] text-white" : "bg-[#EFE4D8] text-[#7A665A]"
                          }`}>
                            {selected ? <CheckCircle2 size={21} /> : <MapPin size={20} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="line-clamp-1 text-base font-black text-slate-800">{place.name}</h3>
                              <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${
                                selected ? "bg-white/80 text-[#2563EB]" : "bg-[#F9F7F2] text-slate-400"
                              }`}>
                                {selected ? "추가됨" : "추가"}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs font-bold leading-relaxed text-slate-400">
                              {place.address || "주소 정보가 없습니다."}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                onClick={() => setAddPlaceFolderId(null)}
                className="mt-5 w-full rounded-2xl bg-slate-800 px-5 py-4 text-sm font-black text-white shadow-[0_14px_35px_rgba(31,41,55,0.22)] transition-all hover:-translate-y-0.5 hover:bg-slate-950"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}`}>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <span className="text-sm font-bold text-red-400">삭제되었습니다.</span>
          <button onClick={handleUndo} className="flex items-center gap-1.5 text-blue-400 font-black text-sm uppercase"><RotateCcw size={14} /> 실행취소</button>
        </div>
      </div>

      <footer className="relative z-10 mt-20 border-t border-[#D7D3C8]/70 bg-[#EFECE5]/88 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-8 py-7">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#B88A62]" />
              <div className="flex items-center gap-2 rounded-full border border-[#D8C9B8] bg-white/70 px-4 py-2 shadow-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFF4D6] shadow-inner">
                  <Star
                    size={13}
                    className="fill-[#D8A63A] text-[#B8861D]"
                    strokeWidth={2.4}
                  />
                </div>

                <span className="text-sm font-black tracking-wide text-slate-800">
                  여행 돋보기
                </span>

                <span className="text-[#B9AAA0]">•</span>

                <span className="text-sm font-bold text-[#7A665A]">
                  즐겨찾기
                </span>
              </div>

              <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#B88A62]" />
            </div>

            <p className="text-[11px] font-semibold tracking-wide text-[#9C877F]">
              © 2026 캡스톤디자인 3조 코더사이저
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
