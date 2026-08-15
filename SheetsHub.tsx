import React, { useState, useEffect } from 'react';
import { 
  Search, Printer, BookOpen, GraduationCap, Plus, Filter, Building2, 
  Sparkles, Layers, CheckSquare, Square, Check, ChevronLeft, ArrowRight, 
  UserCheck, Award, Users, FolderTree, Landmark, ShieldAlert, ArrowLeft,
  X, MessageCircle, FileUp, AlertCircle, FileQuestion, FileX, Lock, EyeOff
} from 'lucide-react';
import { StudySheet, PrintFileOptions } from '../types';
import { SAMPLE_STUDY_SHEETS } from '../data/initialData';
import { formatSDG } from '../utils/pricing';
import neelainLogo from '../assets/images/neelain_exact_logo_1785951359550.jpg';
import { NEELAIN_COLLEGES, ACADEMIC_LEVELS, getStoredUniversities, UniversityInfo, getStoredAcademicLevels, AcademicLevel, getStoredDegreeTracks, DegreeTrackInfo } from '../data/neelainData';
import { getUniversitiesFromCloud, subscribeToCloudUniversities, getAcademicLevelsFromCloud, subscribeToCloudAcademicLevels, getDegreeTracksFromCloud, subscribeToCloudDegreeTracks } from '../lib/firebase';

interface SheetsHubProps {
  sheets: StudySheet[];
  onSelectSheetForPrint: (sheetOptions: Partial<PrintFileOptions> | Partial<PrintFileOptions>[]) => void;
  onAddSheet?: (sheet: StudySheet) => void;
}

export const SheetsHub: React.FC<SheetsHubProps> = ({ sheets, onSelectSheetForPrint, onAddSheet }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  // Dynamic Universities list from localStorage / defaults
  const [sudanUnis, setSudanUnis] = useState<UniversityInfo[]>(() => getStoredUniversities());
  // Dynamic Academic Levels & Semesters from localStorage / defaults
  const [academicLevels, setAcademicLevels] = useState<AcademicLevel[]>(() => getStoredAcademicLevels());
  // Dynamic Degree Tracks (Bachelor / Diploma) from localStorage / defaults
  const [degreeTracks, setDegreeTracks] = useState<DegreeTrackInfo[]>(() => getStoredDegreeTracks());

  useEffect(() => {
    // 1. Initial fetch from Cloud Firestore & Server API
    getUniversitiesFromCloud().then(cloudUnis => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        setSudanUnis(cloudUnis);
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
        } catch (e) {}
      } else {
        fetch('/api/universities')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
              setSudanUnis(data);
              try {
                localStorage.setItem('a4_universities_data', JSON.stringify(data));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Initial fetch for Academic Levels
    getAcademicLevelsFromCloud().then(cloudLevels => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        setAcademicLevels(cloudLevels);
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
        } catch (e) {}
      } else {
        fetch('/api/academic-levels')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
              setAcademicLevels(data);
              try {
                localStorage.setItem('a4_academic_levels_data', JSON.stringify(data));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // Initial fetch for Degree Tracks
    getDegreeTracksFromCloud().then(cloudTracks => {
      if (cloudTracks && Array.isArray(cloudTracks) && cloudTracks.length > 0) {
        setDegreeTracks(cloudTracks);
        try {
          localStorage.setItem('a4_degree_tracks_data', JSON.stringify(cloudTracks));
        } catch (e) {}
      } else {
        fetch('/api/degree-tracks')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && Array.isArray(data) && data.length > 0) {
              setDegreeTracks(data);
              try {
                localStorage.setItem('a4_degree_tracks_data', JSON.stringify(data));
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }).catch(() => {});

    // 2. Real-time Firestore subscription (Cross-device and cross-browser)
    const unsubscribeCloud = subscribeToCloudUniversities((cloudUnis) => {
      if (cloudUnis && Array.isArray(cloudUnis) && cloudUnis.length > 0) {
        setSudanUnis(cloudUnis);
        try {
          localStorage.setItem('a4_universities_data', JSON.stringify(cloudUnis));
        } catch (e) {}
      }
    });

    const unsubscribeCloudLevels = subscribeToCloudAcademicLevels((cloudLevels) => {
      if (cloudLevels && Array.isArray(cloudLevels) && cloudLevels.length > 0) {
        setAcademicLevels(cloudLevels);
        try {
          localStorage.setItem('a4_academic_levels_data', JSON.stringify(cloudLevels));
        } catch (e) {}
      }
    });

    const unsubscribeCloudTracks = subscribeToCloudDegreeTracks((cloudTracks) => {
      if (cloudTracks && Array.isArray(cloudTracks) && cloudTracks.length > 0) {
        setDegreeTracks(cloudTracks);
        try {
          localStorage.setItem('a4_degree_tracks_data', JSON.stringify(cloudTracks));
        } catch (e) {}
      }
    });

    // 3. Local custom event & storage event listener
    const handleUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setSudanUnis(e.detail);
      } else {
        setSudanUnis(getStoredUniversities());
      }
    };
    window.addEventListener('a4_universities_updated', handleUpdate);

    const handleLevelsUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAcademicLevels(e.detail);
      } else {
        setAcademicLevels(getStoredAcademicLevels());
      }
    };
    window.addEventListener('a4_academic_levels_updated', handleLevelsUpdate);

    const handleTracksUpdate = (e?: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setDegreeTracks(e.detail);
      } else {
        setDegreeTracks(getStoredDegreeTracks());
      }
    };
    window.addEventListener('a4_degree_tracks_updated', handleTracksUpdate);

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('storage', handleLevelsUpdate);
    window.addEventListener('storage', handleTracksUpdate);

    // 4. Cross-tab BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    let levelsBc: BroadcastChannel | null = null;
    let tracksBc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('a4_universities_channel');
        bc.onmessage = (ev) => {
          if (ev?.data?.type === 'UNIVERSITIES_UPDATED' && Array.isArray(ev?.data?.list)) {
            setSudanUnis(ev.data.list);
          }
        };
      } catch (e) {}

      try {
        levelsBc = new BroadcastChannel('a4_academic_levels_channel');
        levelsBc.onmessage = (ev) => {
          if (ev?.data?.type === 'ACADEMIC_LEVELS_UPDATED' && Array.isArray(ev?.data?.list)) {
            setAcademicLevels(ev.data.list);
          }
        };
      } catch (e) {}

      try {
        tracksBc = new BroadcastChannel('a4_degree_tracks_channel');
        tracksBc.onmessage = (ev) => {
          if (ev?.data?.type === 'DEGREE_TRACKS_UPDATED' && Array.isArray(ev?.data?.list)) {
            setDegreeTracks(ev.data.list);
          }
        };
      } catch (e) {}
    }

    return () => {
      if (unsubscribeCloud) unsubscribeCloud();
      if (unsubscribeCloudLevels) unsubscribeCloudLevels();
      if (unsubscribeCloudTracks) unsubscribeCloudTracks();
      window.removeEventListener('a4_universities_updated', handleUpdate);
      window.removeEventListener('a4_academic_levels_updated', handleLevelsUpdate);
      window.removeEventListener('a4_degree_tracks_updated', handleTracksUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('storage', handleLevelsUpdate);
      window.removeEventListener('storage', handleTracksUpdate);
      if (bc) {
        try { bc.close(); } catch (e) {}
      }
      if (levelsBc) {
        try { levelsBc.close(); } catch (e) {}
      }
      if (tracksBc) {
        try { tracksBc.close(); } catch (e) {}
      }
    };
  }, []);

  // Active View Mode: 'leader' (دليل الليدر والجامعات) OR 'browse' (المكتبة العامة)
  const [activeMode, setActiveMode] = useState<'leader' | 'browse'>('leader');

  // Leader drill-down navigation steps:
  // 'universities' -> 'colleges' -> 'departments' -> 'degree_tracks' -> 'levels' -> 'semesters' -> 'semester_sheets'
  const [leaderStep, setLeaderStep] = useState<'universities' | 'colleges' | 'departments' | 'degree_tracks' | 'levels' | 'semesters' | 'semester_sheets'>('universities');

  const [selectedUni, setSelectedUni] = useState<string>('جامعة النيلين');
  const [selectedCollege, setSelectedCollege] = useState<string>('كلية علوم الحاسوب وتقانة المعلومات');
  const [selectedLeaderDept, setSelectedLeaderDept] = useState<string | null>('علوم الحاسوب');
  const [selectedDegreeTrack, setSelectedDegreeTrack] = useState<'bachelor' | 'diploma' | null>('bachelor');
  const [selectedLevelNum, setSelectedLevelNum] = useState<number | null>(1);
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number | null>(1);

  // Multi-selection & Copies state
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>(() => 
    SAMPLE_STUDY_SHEETS.filter(s => s.isAvailable !== false).map(s => s.id)
  );
  const [sheetCopies, setSheetCopies] = useState<Record<string, number>>({});

  const getCopies = (sheetId: string) => sheetCopies[sheetId] || 1;

  const updateSheetCopies = (sheetId: string, delta: number) => {
    setSheetCopies(prev => {
      const current = prev[sheetId] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [sheetId]: updated };
    });
  };

  // New sheet contribution form state
  const [newCollege, setNewCollege] = useState<string>('كلية علوم الحاسوب وتقانة المعلومات');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState<string>('علوم الحاسوب');
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newSubject, setNewSubject] = useState('');
  const [newPageCount, setNewPageCount] = useState(30);
  const [newAuthor, setNewAuthor] = useState('');
  const [newDegreeType, setNewDegreeType] = useState<'bachelor' | 'diploma'>('bachelor');

  // Temporary notice when trying to access disabled level or semester
  const [inactiveNotice, setInactiveNotice] = useState<string | null>(null);

  // Helper to get semester display title
  const getSemesterLabel = (semNum: number | null) => {
    if (!semNum) return 'جميع الفصول الدراسية';
    for (const level of academicLevels) {
      const sem = level.semesters.find(s => s.id === semNum);
      if (sem) {
        return `${sem.title} (${level.title})`;
      }
    }
    return `الفصل الدراسي ${semNum}`;
  };

  // Filter lists for Browse Mode
  const departmentsList = [
    { id: 'all', label: 'جميع الأقسام' },
    { id: 'علوم الحاسوب', label: 'علوم الحاسوب' },
    { id: 'تقانة المعلومات', label: 'تقانة المعلومات' },
    { id: 'نظم المعلومات', label: 'نظم المعلومات' },
    { id: 'هندسة البرمجيات', label: 'هندسة البرمجيات' },
  ];

  const semestersList = [
    { id: 'all', label: 'جميع الفصول (1 إلى 8)' },
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(num => ({ id: String(num), label: `الفصل الدراسي ${num}` }))
  ];

  // Filter sheets for Browse Mode
  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sheet.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sheet.authorOrLecturer && sheet.authorOrLecturer.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDept = selectedDept === 'all' || sheet.department === selectedDept;
    const matchesSemester = selectedSemester === 'all' || sheet.semester === Number(selectedSemester);
    
    return matchesSearch && matchesDept && matchesSemester;
  });

  // Filter sheets for Leader Mode
  const leaderFilteredSheets = sheets.filter(sheet => {
    const matchesCollege = !selectedCollege || !sheet.facultyOrYear || sheet.facultyOrYear.includes(selectedCollege) || selectedCollege.includes(sheet.facultyOrYear);
    
    const normalizedSelectedDept = (selectedLeaderDept || '').replace(/^قسم\s+/, '').trim();
    const normalizedSheetDept = (sheet.department || '').replace(/^قسم\s+/, '').trim();
    const matchesDept = !selectedLeaderDept || 
      normalizedSheetDept === normalizedSelectedDept || 
      normalizedSheetDept.includes(normalizedSelectedDept) || 
      normalizedSelectedDept.includes(normalizedSheetDept);

    const matchesDegree = !selectedDegreeTrack || !sheet.degreeType || sheet.degreeType === selectedDegreeTrack;
    const matchesSemester = !selectedSemesterNum || sheet.semester === selectedSemesterNum;
    return matchesCollege && matchesDept && matchesDegree && matchesSemester;
  });

  const activeSheetsInView = activeMode === 'leader' && leaderStep === 'semester_sheets' ? leaderFilteredSheets : filteredSheets;
  const availableFilteredSheets = activeSheetsInView.filter(s => s.isAvailable !== false);
  const selectedSheetsInView = availableFilteredSheets.filter(s => selectedSheetIds.includes(s.id));
  const selectedTotalPrice = selectedSheetsInView.reduce((sum, s) => sum + (s.priceEstimate * getCopies(s.id)), 0);

  const isAllSelected = availableFilteredSheets.length > 0 && availableFilteredSheets.every(s => selectedSheetIds.includes(s.id));

  const toggleSelectSheet = (id: string) => {
    setSelectedSheetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const availableIdsInView = new Set(availableFilteredSheets.map(s => s.id));
      setSelectedSheetIds(prev => prev.filter(id => !availableIdsInView.has(id)));
    } else {
      const availableIdsInView = availableFilteredSheets.map(s => s.id);
      setSelectedSheetIds(prev => Array.from(new Set([...prev, ...availableIdsInView])));
    }
  };

  const buildSheetHierarchyPath = (sheet: StudySheet) => {
    const uni = sheet.institution || selectedUni || 'جامعة النيلين';
    const college = sheet.facultyOrYear || selectedCollege || 'كلية علوم الحاسوب';
    const dept = sheet.department ? `قسم ${sheet.department}` : 'جميع الأقسام';
    const degree = sheet.degreeType === 'diploma' ? 'دبلوم' : 'بكالوريوس';
    const sem = sheet.semester ? `الفصل الدراسي ${sheet.semester}` : getSemesterLabel(selectedSemesterNum);
    
    return `${uni} ⬅️ ${college} ⬅️ ${dept} ⬅️ ${degree} ⬅️ ${sem}`;
  };

  const handlePrintSheet = (sheet: StudySheet) => {
    const hierarchy = buildSheetHierarchyPath(sheet);
    const copies = getCopies(sheet.id);
    onSelectSheetForPrint({
      fileName: `${sheet.title}.pdf`,
      pageCount: sheet.pageCount || 40,
      color: sheet.recommendedColor,
      binding: sheet.recommendedBinding,
      sides: 'double',
      copies: copies,
      notes: `شيت من مكتبة الكلية الشاملة | المسار الأكاديمي: (${hierarchy}) | دكتور المادة: ${sheet.authorOrLecturer || 'معتمد'}`,
    });
  };

  const handlePrintSelectedSheets = () => {
    if (selectedSheetsInView.length === 0) {
      alert('الرجاء تحديد مادة واحدة على الأقل للطباعة!');
      return;
    }

    const optionsList: Partial<PrintFileOptions>[] = selectedSheetsInView.map(sheet => {
      const hierarchy = buildSheetHierarchyPath(sheet);
      const copies = getCopies(sheet.id);
      return {
        fileName: `${sheet.title}.pdf`,
        pageCount: sheet.pageCount || 40,
        color: sheet.recommendedColor,
        binding: sheet.recommendedBinding,
        sides: 'double',
        copies: copies,
        notes: `شيت من المكتبة الجامعية | المسار: (${hierarchy}) | دكتور المادة: ${sheet.authorOrLecturer || 'معتمد'}`,
      };
    });

    onSelectSheetForPrint(optionsList);
  };

  const handleAddCustomSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    const created: StudySheet = {
      id: `sheet-custom-${Date.now()}`,
      title: newTitle,
      institution: 'جامعة النيلين',
      facultyOrYear: newCollege,
      department: newDept,
      semester: newSemester,
      degreeType: newDegreeType,
      subject: newSubject,
      pageCount: newPageCount,
      authorOrLecturer: newAuthor || 'دكتور المادة',
      fileUrl: '#',
      downloadCount: 1,
      recommendedColor: 'bw',
      recommendedBinding: 'spiral_plastic',
      priceEstimate: newPageCount * 60 + 1200,
      isAvailable: true,
    };

    if (onAddSheet) {
      onAddSheet(created);
    }
    setShowUploadModal(false);
    // Reset form
    setNewTitle('');
    setNewSubject('');
    setNewAuthor('');
    alert('تمت إضافة الشيت إلى مكتبة الكلية بنجاح!');
  };

  const currentUniObj = sudanUnis.find(u => u.name === selectedUni) || sudanUnis[0];
  const currentCollegeList = currentUniObj ? currentUniObj.colleges : NEELAIN_COLLEGES;
  const currentCollegeObj = currentCollegeList.find(c => c.name === selectedCollege) || currentCollegeList[0] || NEELAIN_COLLEGES[0];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      
      {/* ========================================================================= */}
      {/* LEADER SECTION (قسم الليدر والجامعات والفصول الدراسية)                   */}
      {/* ========================================================================= */}
      {activeMode === 'leader' && (
        <div className="space-y-5 mb-10">
          
          {/* STEP 1: UNIVERSITIES LIST (الجامعات) */}
          {leaderStep === 'universities' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span>جميع الجامعات المتاحة ({sudanUnis.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    اختر الجامعة لعرض الكليات والأقسام الدراسية المتاحة
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  {sudanUnis.length} جامعات متوفرة ✓
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sudanUnis.map((uni) => {
                  const isNeelain = uni.id === 'neelain';
                  const isUnavailable = uni.active === false || uni.badge === 'غير متاح الان' || uni.badge?.includes('غير متاح');
                  return (
                    <div 
                      key={uni.id}
                      onClick={() => {
                        if (isUnavailable) {
                          alert(`عذراً، خدمات الشيتات والمكتبة غير متاحة حالياً بـ (${uni.name}).`);
                          return;
                        }
                        setSelectedUni(uni.name);
                        const firstCol = uni.colleges[0];
                        if (firstCol) {
                          setSelectedCollege(firstCol.name);
                          setSelectedLeaderDept(firstCol.departments[0]?.name || null);
                        }
                        setLeaderStep('colleges');
                      }}
                      className={`rounded-xl p-4 shadow-sm border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                        isUnavailable
                          ? 'opacity-40 grayscale-[60%] cursor-not-allowed bg-slate-800 text-slate-300 border-rose-500/50 hover:border-rose-500'
                          : isNeelain 
                            ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white border-2 border-amber-400 shadow-md ring-1 ring-amber-400/30 cursor-pointer group hover:border-amber-300' 
                            : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border-emerald-600 cursor-pointer group hover:border-amber-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 border ${
                            isUnavailable ? 'bg-rose-950/50 text-rose-300 border-rose-700/50' : 'bg-white/10 text-amber-300 border-emerald-400/30'
                          }`}>
                            {isNeelain ? (
                              <img src={neelainLogo} alt="جامعة النيلين" className="w-full h-full object-contain p-0.5 rounded-lg" />
                            ) : (
                              <Building2 className={`w-5 h-5 ${isUnavailable ? 'text-rose-300' : 'text-amber-300'}`} />
                            )}
                          </div>
                          <span className={`font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs ${
                            isUnavailable
                              ? 'bg-rose-600 text-white border border-rose-400'
                              : 'bg-amber-400 text-slate-950'
                          }`}>
                            {isUnavailable ? 'غير متاح الان' : (uni.badge || 'متوفرة حالياً ✓')}
                          </span>
                        </div>

                        <h3 className={`text-base font-black transition-colors ${
                          isUnavailable ? 'text-slate-300 line-through' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {uni.name}
                        </h3>
                        <p className={`text-[11px] leading-tight mt-1 ${isUnavailable ? 'text-slate-400' : 'text-emerald-200/90'}`}>
                          {isUnavailable ? 'هذه الجامعة غير متاحة حالياً لطلبات الشيتات وطباعة المقررات.' : uni.description}
                        </p>
                      </div>

                      <div className={`flex items-center justify-between pt-2.5 border-t text-[11px] font-bold ${
                        isUnavailable ? 'border-rose-900/50 text-rose-300' : 'border-emerald-800/80 text-emerald-300'
                      }`}>
                        {isUnavailable ? (
                          <span className="text-rose-300 font-extrabold flex items-center gap-1">
                            🚫 غير متاحة (مغلقة)
                          </span>
                        ) : (
                          <>
                            <span>عرض الكليات ({uni.collegesCount})</span>
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: COLLEGES LIST (الكليات المتاحة بالجامعة) */}
          {leaderStep === 'colleges' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setLeaderStep('universities')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                      <span>{selectedUni} • اختر الكلية المعتمدة</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      الكليات والبرامج الدراسية (بكالوريوس ودبلوم) المتاحة بـ {selectedUni}
                    </p>
                  </div>
                </div>

                {/* DEGREE TRACK FILTER BUTTONS */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedDegreeTrack(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedDegreeTrack === null
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الكل ({currentCollegeList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDegreeTrack('bachelor')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedDegreeTrack === 'bachelor'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🎓 بكالوريوس
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDegreeTrack('diploma')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      selectedDegreeTrack === 'diploma'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📜 دبلوم
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentCollegeList
                  .filter(col => {
                    if (!selectedDegreeTrack) return true;
                    if (selectedDegreeTrack === 'diploma') return col.degreeType === 'diploma' || col.degreeType === 'both';
                    if (selectedDegreeTrack === 'bachelor') return col.degreeType === 'bachelor' || col.degreeType === 'both' || !col.degreeType;
                    return true;
                  })
                  .map((col) => {
                    const isCommerce = col.id === 'commerce';
                    const isCollegeUnavailable = col.active === false || currentUniObj?.active === false;

                    return (
                      <div 
                        key={col.id}
                        onClick={() => {
                          if (isCollegeUnavailable) {
                            alert(`عذراً، هذه الكلية (${col.name}) غير متاحة الآن.`);
                            return;
                          }
                          setSelectedCollege(col.name);
                          setSelectedLeaderDept(col.departments[0]?.name || null);
                          setLeaderStep('departments');
                        }}
                        className={`rounded-xl p-4 shadow-sm border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                          isCollegeUnavailable
                            ? 'opacity-40 grayscale-[60%] cursor-not-allowed bg-slate-800 text-slate-300 border-rose-500/50 hover:border-rose-500'
                            : isCommerce 
                              ? 'bg-gradient-to-br from-amber-950 via-emerald-900 to-emerald-950 text-white border-2 border-amber-400 shadow-lg shadow-amber-400/10 ring-2 ring-amber-400/20 sm:col-span-2 cursor-pointer group' 
                              : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border-emerald-600 hover:border-amber-400 cursor-pointer group'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2 pt-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-xs ${
                                isCollegeUnavailable
                                  ? 'bg-rose-600 text-white border border-rose-400'
                                  : isCommerce 
                                    ? 'bg-amber-400 text-slate-950 animate-pulse' 
                                    : 'bg-emerald-800 text-emerald-100'
                              }`}>
                                {isCollegeUnavailable ? 'غير متاح الان' : (col.badge || 'معتمدة')}
                              </span>

                              {col.degreeType === 'diploma' && (
                                <span className="bg-purple-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                                  📜 دبلوم تقني
                                </span>
                              )}
                              {col.degreeType === 'both' && (
                                <span className="bg-amber-300 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                                  🎓📜 بكالوريوس + دبلوم
                                </span>
                              )}
                              {(col.degreeType === 'bachelor' || !col.degreeType) && (
                                <span className="bg-emerald-700 text-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  🎓 بكالوريوس
                                </span>
                              )}
                            </div>

                            <span className={`font-bold text-[11px] ${isCollegeUnavailable ? 'text-rose-300' : 'text-amber-300'}`}>
                              {col.departments.length} أقسام تخصصية
                            </span>
                          </div>

                          <h3 className={`font-black transition-colors ${
                            isCollegeUnavailable
                              ? 'text-lg sm:text-xl text-slate-300 line-through'
                              : isCommerce 
                                ? 'text-xl sm:text-2xl text-amber-300 group-hover:text-amber-200' 
                                : 'text-lg sm:text-xl text-white group-hover:text-amber-300'
                          }`}>
                            <span>{col.name}</span>
                          </h3>
                          {col.description && (
                            <p className={`text-xs mt-1 line-clamp-2 ${isCollegeUnavailable ? 'text-slate-400' : 'text-emerald-200/90'}`}>
                              {isCollegeUnavailable ? 'خدمات المذكرات والشيتات متوقفة حالياً لهذه الكلية.' : col.description}
                            </p>
                          )}
                        </div>

                        <div className={`flex items-center justify-between pt-2.5 border-t text-xs font-bold ${
                          isCollegeUnavailable
                            ? 'border-rose-900/50 text-rose-300'
                            : isCommerce 
                              ? 'border-amber-400/40 text-amber-300' 
                              : 'border-emerald-800/80 text-emerald-300'
                        }`}>
                          {isCollegeUnavailable ? (
                            <span className="text-rose-300 font-extrabold flex items-center gap-1">
                              🚫 غير متاح الان (مغلقة)
                            </span>
                          ) : (
                            <>
                              <span>تصفح أقسام {col.name}</span>
                              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 3: DEPARTMENTS LIST (أقسام الكلية المختارة) */}
          {leaderStep === 'departments' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setLeaderStep('colleges')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-emerald-600" />
                      <span>{selectedCollege} • اختر القسم أو التخصص</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      الأقسام المعتمدة في {selectedCollege}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(currentCollegeObj?.departments || []).map((dept) => (
                  <div 
                    key={dept.id}
                    onClick={() => {
                      setSelectedLeaderDept(dept.name);
                      setLeaderStep('degree_tracks');
                    }}
                    className="bg-emerald-900 text-white rounded-xl p-3.5 shadow-sm border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-amber-300 font-black border border-emerald-600/60 shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          {dept.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-emerald-200/90 leading-tight">
                        {dept.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                      <span>اختيار البكالوريوس / الدبلوم</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: DEGREE TRACKS (بكالوريوس / دبلوم) */}
          {leaderStep === 'degree_tracks' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setLeaderStep('departments')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <span>{selectedCollege} ({selectedLeaderDept}) • اختر الدرجة العلمية</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر المسار الأكاديمي (طلاب البكالوريوس والدبلوم فقط)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
                {/* 1. Bachelor Track */}
                <div 
                  onClick={() => {
                    setSelectedDegreeTrack('bachelor');
                    setLeaderStep('levels');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-5 border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group text-center space-y-2.5 shadow-sm"
                >
                  <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center text-amber-300 mx-auto border border-emerald-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    بكالوريوس
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    {currentCollegeObj?.levelsCount === 5 
                      ? '5 مستويات دراسية (10 فصول - بكالوريوس الشرف)' 
                      : '4 مستويات دراسية معتمدة (8 فصول دراسية)'}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 text-slate-950 font-black rounded-lg text-xs">
                    <span>{currentCollegeObj?.levelsCount === 5 ? 'عرض المستويات الخمسة (5)' : 'عرض المستويات الأربعة (4)'}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* 2. Diploma Track */}
                <div 
                  onClick={() => {
                    setSelectedDegreeTrack('diploma');
                    setLeaderStep('levels');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-5 border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group text-center space-y-2.5 shadow-sm"
                >
                  <div className="w-12 h-12 bg-emerald-800 rounded-xl flex items-center justify-center text-amber-300 mx-auto border border-emerald-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    دبلوم
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    مستويان دراسيان معتمدان (4 فصول دراسية)
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 text-slate-950 font-black rounded-lg text-xs">
                    <span>عرض مستويات الدبلوم</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Temporary Notice Modal/Banner when clicking an inactive Level/Semester */}
          {inactiveNotice && (
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-900/80 border border-rose-500/50 flex items-center justify-center text-rose-300 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-300 flex items-center gap-1.5">
                    <span>تنبيه: محتوى غير متاح مؤقتاً</span>
                  </h4>
                  <p className="text-xs text-rose-100 font-medium mt-0.5">
                    {inactiveNotice}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInactiveNotice(null)}
                className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* STEP 5: ACADEMIC LEVELS (المستويات) */}
          {leaderStep === 'levels' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setLeaderStep('degree_tracks')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600" />
                      <span>
                        المستويات الدراسية ({selectedCollege} - {selectedLeaderDept} - {selectedDegreeTrack === 'bachelor' ? 'بكالوريوس' : 'دبلوم'})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر المستوى الأكاديمي للانتقال للفصول الدراسية
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {academicLevels
                  .filter(lvl => selectedDegreeTrack === 'diploma' ? lvl.levelNum <= 2 : lvl.levelNum <= (currentCollegeObj?.levelsCount || 4))
                  .map((lvl) => {
                    const isLvlActive = lvl.active !== false;
                    return (
                      <div
                        key={lvl.levelNum}
                        onClick={() => {
                          if (!isLvlActive) {
                            setInactiveNotice(`⚠️ هذا المستوى الدراسي (${lvl.title}) مغلق وموقوف حالياً من قِبل إدارة المنصة ولا يمكن للطلاب الدخول إليه.`);
                            return;
                          }
                          setSelectedLevelNum(lvl.levelNum);
                          setLeaderStep('semesters');
                        }}
                        className={`rounded-xl p-3.5 transition-all shadow-xs flex flex-col justify-between space-y-2.5 relative overflow-hidden ${
                          isLvlActive
                            ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border border-emerald-600/80 hover:border-amber-400 cursor-pointer group'
                            : 'bg-slate-900/90 text-slate-300 border-2 border-dashed border-rose-500/60 opacity-75 cursor-not-allowed group'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-xs ${
                              isLvlActive ? 'bg-amber-400 text-slate-950' : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            }`}>
                              {isLvlActive ? lvl.badge : `${lvl.badge} (مغلق)`}
                            </span>
                            {isLvlActive ? (
                              <span className="text-[10px] text-emerald-300 font-bold">
                                {lvl.yearLabel}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-black bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30">
                                <Lock className="w-3 h-3" />
                                <span>غير متاح الآن ⏸️</span>
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base font-black transition-colors ${
                            isLvlActive ? 'text-white group-hover:text-amber-300' : 'text-slate-300'
                          }`}>
                            {lvl.title}
                          </h3>
                          <p className={`text-[11px] leading-tight ${
                            isLvlActive ? 'text-emerald-100/85' : 'text-slate-400'
                          }`}>
                            {lvl.description}
                          </p>
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
                          isLvlActive
                            ? 'border-emerald-800/80 text-amber-300 group-hover:translate-x-[-2px] transition-transform'
                            : 'border-slate-800 text-rose-400'
                        }`}>
                          <span>{isLvlActive ? 'عرض الفصول الدراسية' : 'المستوى موقوف حالياً'}</span>
                          {isLvlActive ? <ArrowLeft className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: SEMESTERS (الفصول الدراسية للمستوى المختار) */}
          {leaderStep === 'semesters' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => setLeaderStep('levels')}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                      <span>
                        فصول {academicLevels.find(l => l.levelNum === selectedLevelNum)?.title || `المستوى ${selectedLevelNum}`} ({selectedCollege} - {selectedLeaderDept})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر الفصل الدراسي للوصول للشيتات والمذكرات المقررة
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const currentLvl = academicLevels.find(l => l.levelNum === selectedLevelNum);
                  const isParentLevelActive = currentLvl?.active !== false;
                  return (currentLvl?.semesters || []).map((sem) => {
                    const isSemActive = isParentLevelActive && sem.active !== false;
                    return (
                      <div
                        key={sem.id}
                        onClick={() => {
                          if (!isSemActive) {
                            setInactiveNotice(`⚠️ هذا الفصل الدراسي (${sem.title}) مغلق وموقوف حالياً من قِبل إدارة المنصة ولا يمكن للطلاب الدخول إليه.`);
                            return;
                          }
                          setSelectedSemesterNum(sem.id);
                          setLeaderStep('semester_sheets');
                        }}
                        className={`rounded-xl p-3.5 transition-all shadow-xs flex flex-col justify-between space-y-2 relative overflow-hidden ${
                          isSemActive
                            ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border border-emerald-600 hover:border-amber-400 cursor-pointer group'
                            : 'bg-slate-900/90 text-slate-300 border-2 border-dashed border-rose-500/60 opacity-75 cursor-not-allowed group'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs ${
                              isSemActive ? 'bg-amber-400 text-slate-950' : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                            }`}>
                              {isSemActive ? sem.label : `${sem.label} (مغلق)`}
                            </span>
                            {isSemActive ? (
                              <span className="text-[11px] text-emerald-300 font-bold">
                                قسم {selectedLeaderDept}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-black bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30">
                                <Lock className="w-3 h-3" />
                                <span>غير متاح الآن ⏸️</span>
                              </span>
                            )}
                          </div>

                          <h3 className={`text-base sm:text-lg font-black transition-colors ${
                            isSemActive ? 'text-white group-hover:text-amber-300' : 'text-slate-300'
                          }`}>
                            {sem.title}
                          </h3>
                          <p className={`text-[11px] leading-tight ${
                            isSemActive ? 'text-emerald-100/90' : 'text-slate-400'
                          }`}>
                            {sem.desc}
                          </p>
                        </div>

                        <div className={`pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
                          isSemActive
                            ? 'border-emerald-800/80 text-amber-300'
                            : 'border-slate-800 text-rose-400'
                        }`}>
                          <span>{isSemActive ? 'عرض المواد والشيتات' : 'الفصل الدراسي موقوف حالياً'}</span>
                          {isSemActive ? (
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* STEP 7: SEMESTER SHEETS (عرض الشيتات والمواد للفصل الدراسي) */}
          {leaderStep === 'semester_sheets' && (
            <div className="space-y-4">
              
              {/* Semester Banner Header */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-2xl p-4 shadow-sm border border-emerald-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg">
                    {getSemesterLabel(selectedSemesterNum)}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      شيتات {getSemesterLabel(selectedSemesterNum)}
                    </h2>
                    <p className="text-[11px] text-emerald-200">
                      {selectedCollege} • قسم {selectedLeaderDept} • {selectedDegreeTrack === 'bachelor' ? 'بكالوريوس' : 'دبلوم'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLeaderStep('semesters')}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>تغيير الفصل</span>
                  </button>
                </div>
              </div>

              {/* Multi-Selection Dynamic Order & Total Calculation Box */}
              {leaderFilteredSheets.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-3 sm:p-4 shadow-sm border border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleToggleSelectAll}
                        className="bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {isAllSelected ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-300" />
                            <span>إلغاء تحديد الكل</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-emerald-300" />
                            <span>تحديد الكل ({availableFilteredSheets.length})</span>
                          </>
                        )}
                      </button>

                      <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md text-[11px]">
                        {selectedSheetsInView.length} من {availableFilteredSheets.length} مواد مختارة
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-emerald-200 text-xs">الإجمالي:</span>
                      <span className="text-xl font-black text-amber-300 tracking-tight">
                        {formatSDG(selectedTotalPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0">
                    <button
                      onClick={handlePrintSelectedSheets}
                      disabled={selectedSheetsInView.length === 0}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                        selectedSheetsInView.length > 0
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-[0.98]'
                          : 'bg-emerald-800/60 text-emerald-400 cursor-not-allowed border border-emerald-700'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>
                        {selectedSheetsInView.length > 0 
                          ? `طلب طباعة المواد المختارة (${selectedSheetsInView.length})`
                          : 'اختر المادة للطباعة'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sheets Grid OR Prominent A4 Sudan Help Box when Empty */}
              {leaderFilteredSheets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {leaderFilteredSheets.map(sheet => {
                    const isAvailable = sheet.isAvailable !== false;
                    const isSelected = selectedSheetIds.includes(sheet.id) && isAvailable;

                    return (
                      <div 
                        key={sheet.id}
                        onClick={() => isAvailable && toggleSelectSheet(sheet.id)}
                        className={`bg-white rounded-xl border p-3.5 shadow-xs transition-all flex flex-col justify-between group relative cursor-pointer ${
                          !isAvailable
                            ? 'border-rose-200 bg-slate-50/70 opacity-80 cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-2 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              {isAvailable ? (
                                <div 
                                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : 'border-2 border-slate-300 bg-white text-transparent group-hover:border-emerald-500'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px]">
                                  ✕
                                </div>
                              )}

                              <span className="bg-emerald-100 text-emerald-950 font-bold px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px]">
                                <img src={neelainLogo} alt="لوقو" className="w-3 h-3 object-contain rounded-xs" />
                                جامعة النيلين
                              </span>
                            </div>

                            <span className="bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                              فصل {sheet.semester || selectedSemesterNum || 1}
                            </span>
                          </div>

                          <h3 className={`font-bold text-sm sm:text-base transition-colors line-clamp-1 mb-1 ${
                            isAvailable 
                              ? isSelected ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-800'
                              : 'text-slate-500 line-through'
                          }`}>
                            {sheet.title}
                          </h3>

                          <div className="text-[11px] text-slate-500 space-y-0.5 mb-3">
                            <p className="truncate">المادة: <strong className="text-slate-700">{sheet.subject}</strong> ({sheet.department})</p>
                            {sheet.authorOrLecturer && (
                              <p className="truncate">المحاضر: <strong className="text-slate-700">{sheet.authorOrLecturer}</strong></p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5" onClick={e => e.stopPropagation()}>
                          <div>
                            <span className="text-[10px] text-slate-400 block">السعر:</span>
                            <strong className="text-emerald-900 font-black text-xs sm:text-sm">
                              {formatSDG(sheet.priceEstimate * getCopies(sheet.id))}
                            </strong>
                          </div>

                          <div className="flex items-center gap-1">
                            {isAvailable && (
                              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => updateSheetCopies(sheet.id, -1)}
                                  className="w-5 h-5 bg-white hover:bg-slate-200 text-slate-800 rounded font-black flex items-center justify-center cursor-pointer text-xs shadow-2xs"
                                  title="إنقاص عدد النسخ"
                                >
                                  -
                                </button>
                                <span className="w-5 text-center text-slate-900 font-black text-xs">
                                  {getCopies(sheet.id)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateSheetCopies(sheet.id, 1)}
                                  className="w-5 h-5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded font-black flex items-center justify-center cursor-pointer text-xs shadow-2xs"
                                  title="زيادة عدد النسخ"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => isAvailable && handlePrintSheet(sheet)}
                              disabled={!isAvailable}
                              className={`font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                                isAvailable 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>اطبع</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* A4 SUDAN HELPFUL REQUEST BOX */
                <div className="text-center py-8 sm:py-10 px-5 sm:px-8 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl border-2 border-emerald-500/80 shadow-xl max-w-2xl mx-auto space-y-5 text-white my-4 relative overflow-hidden">
                  
                  {/* Background accent */}
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center mx-auto font-black shadow-lg shadow-amber-400/20 border-2 border-amber-300">
                    <FileQuestion className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="inline-block bg-emerald-800 text-emerald-100 font-bold text-xs px-3.5 py-1 rounded-full mb-3 border border-emerald-600/80">
                      {selectedUni} • {selectedCollege} • {(selectedLeaderDept || '').startsWith('قسم') ? selectedLeaderDept : `قسم ${selectedLeaderDept}`} • {getSemesterLabel(selectedSemesterNum)}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                      عفواً، لم تتوفر شيتات هذا الفصل 📚
                    </h3>
                  </div>

                  <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
                    ساعد <strong className="text-amber-300 font-black">A4 Sudan</strong> في توفير شيتات هذا الفصل واحصل على <strong className="text-amber-300 font-bold">300 ورقة مطبوعة هدية 🎁</strong>!
                  </p>

                  <div className="flex justify-center pt-2">
                    {/* Single Button: A4 Sudan Assistance */}
                    <a
                      href={`https://wa.me/249119636365?text=${encodeURIComponent(`السلام عليكم فريق A4 Sudan، أود المساعدة في توفير شيتات ومذكرات (${selectedUni} - ${selectedCollege} - ${selectedLeaderDept} - ${getSemesterLabel(selectedSemesterNum)} - ${selectedDegreeTrack === 'bachelor' ? 'بكالوريوس' : 'دبلوم'})`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm inline-flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-amber-400/25 cursor-pointer text-center hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="w-5 h-5 text-slate-950" />
                      <span>ساعد A4 Sudan واحصل على 300 ورقة مطبوعة هدية 🎁</span>
                    </a>
                  </div>

                  <p className="text-[11px] text-emerald-300/80 pt-1">
                    * طباعة فاخرة، وتوصيل سريع حتى باب القاعة أو المنزل.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* GENERAL BROWSE MODE (المكتبة العامة)                                      */}
      {/* ========================================================================= */}
      {false && (
        <>
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 mb-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Search Input */}
              <div className="md:col-span-6 relative">
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم الشيت، المادة، أو الدكتور بكليتك..."
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 text-sm"
                />
              </div>

              {/* Department Selection Dropdown Box */}
              <div className="md:col-span-3">
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 text-sm font-bold cursor-pointer"
                >
                  {departmentsList.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Semester Selection Dropdown Box */}
              <div className="md:col-span-3">
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 text-sm font-bold cursor-pointer"
                >
                  {semestersList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.id === 'all' ? 'جميع الفصول (1 إلى 8)' : s.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Quick Department Filter Pills */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-slate-500 font-bold whitespace-nowrap flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" /> القسم:
                </span>
                {departmentsList.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap font-bold transition-all shrink-0 cursor-pointer ${
                      selectedDept === dept.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {dept.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {selectedSemester === 'all' 
                    ? 'جميع الفصول (1 إلى 8)' 
                    : `الفصل الدراسي ${selectedSemester}`}
                </span>
              </div>
            </div>

          </div>

          {/* University & Faculty Notice Tag & Summary Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm text-emerald-950 font-bold">
              <div className="flex items-center gap-3">
                <img 
                  src={neelainLogo} 
                  alt="لوقو جامعة النيلين" 
                  className="w-7 h-7 object-contain rounded bg-white p-0.5 border border-emerald-300"
                />
                <span>
                  جامعة النيلين • كلية التجارة 
                  {selectedDept !== 'all' && ` • قسم ${selectedDept}`}
                  {selectedSemester !== 'all' && ` • الفصل الدراسي ${selectedSemester}`}
                </span>
              </div>
              <span className="text-emerald-800 font-normal text-xs">
                عرض {filteredSheets.length} شيت دراسي
              </span>
            </div>

            {/* Multi-Selection Dynamic Order & Total Calculation Box */}
            {filteredSheets.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-emerald-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleToggleSelectAll}
                      className="bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isAllSelected ? (
                        <>
                          <CheckSquare className="w-4 h-4 text-emerald-300" />
                          <span>إلغاء تحديد الكل</span>
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 text-emerald-300" />
                          <span>تحديد جميع المواد المتاحة ({availableFilteredSheets.length})</span>
                        </>
                      )}
                    </button>

                    <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs">
                      {selectedSheetsInView.length} من {availableFilteredSheets.length} مواد مختارة
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-emerald-200 text-xs sm:text-sm">إجمالي سعر المواد المختارة:</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                      {formatSDG(selectedTotalPrice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80">
                    * يمكنك التحديد أو إلغاء تحديد أية مادة من القائمة بالأسفل وسيتم تحديث السعر تلقائياً.
                  </p>
                </div>

                <div className="w-full md:w-auto shrink-0">
                  <button
                    onClick={handlePrintSelectedSheets}
                    disabled={selectedSheetsInView.length === 0}
                    className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      selectedSheetsInView.length > 0
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20 active:scale-[0.98]'
                        : 'bg-emerald-800/60 text-emerald-400 cursor-not-allowed border border-emerald-700'
                    }`}
                  >
                    <Printer className="w-5 h-5" />
                    <span>
                      {selectedSheetsInView.length > 0 
                        ? `طلب طباعة المواد المختارة (${selectedSheetsInView.length} مواد)`
                        : 'اختر المادة للطباعة'}
                    </span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Sheets Grid */}
          {filteredSheets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSheets.map(sheet => {
                const isAvailable = sheet.isAvailable !== false;
                const isSelected = selectedSheetIds.includes(sheet.id) && isAvailable;

                return (
                  <div 
                    key={sheet.id}
                    onClick={() => isAvailable && toggleSelectSheet(sheet.id)}
                    className={`bg-white rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between group relative cursor-pointer ${
                      !isAvailable
                        ? 'border-rose-200 bg-slate-50/70 opacity-80 cursor-not-allowed'
                        : isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/20 shadow-md'
                        : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Selection Checkbox & Top Tags */}
                      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <div 
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-emerald-600 text-white shadow-sm' 
                                  : 'border-2 border-slate-300 bg-white text-transparent group-hover:border-emerald-500'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                              ✕
                            </div>
                          )}

                          <span className="bg-emerald-100 text-emerald-950 font-bold px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                            <img src={neelainLogo} alt="لوقو" className="w-3.5 h-3.5 object-contain rounded-sm" />
                            جامعة النيلين
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                            قسم {sheet.department}
                          </span>
                          {sheet.semester && (
                            <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[11px]">
                              فصل {sheet.semester}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className={`font-bold text-base sm:text-lg transition-colors line-clamp-2 mb-2 ${
                        isAvailable 
                          ? isSelected ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-800'
                          : 'text-slate-500 line-through'
                      }`}>
                        {sheet.title}
                      </h3>

                      <p className="text-xs text-slate-500 mb-1">
                        الكلية والمادة: <strong className="text-slate-700">{sheet.facultyOrYear} ({sheet.subject})</strong>
                      </p>
                      {sheet.authorOrLecturer && (
                        <p className="text-xs text-slate-500 mb-4">
                          إعداد / دكتور المادة: <strong className="text-slate-700">{sheet.authorOrLecturer}</strong>
                        </p>
                      )}

                      {isAvailable ? (
                        <div className={`p-3 rounded-xl border text-xs space-y-1 mb-4 transition-colors ${
                          isSelected 
                            ? 'bg-emerald-100/60 border-emerald-200 text-emerald-900' 
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          <div className="flex justify-between">
                            <span>حالة التحديد:</span>
                            <strong className={isSelected ? 'text-emerald-800 font-black' : 'text-slate-600'}>
                              {isSelected ? '✓ مادة مضافة للإجمالي' : 'غير مضافة'}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-100 text-xs text-rose-800 font-bold mb-4">
                          هذه المادة غير متوفرة حالياً في المكتبة، وسوف تضاف فور إعدادها.
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                      <div>
                        <span className="text-[11px] text-slate-400 block">السعر:</span>
                        {isAvailable ? (
                          <strong className="text-emerald-900 font-black text-sm sm:text-base">
                            {formatSDG(sheet.priceEstimate * getCopies(sheet.id))}
                          </strong>
                        ) : (
                          <strong className="text-rose-600 font-bold text-xs">
                            غير متوفرة
                          </strong>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isAvailable && (
                          <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-600 px-1 hidden sm:inline">النسخ:</span>
                            <button
                              type="button"
                              onClick={() => updateSheetCopies(sheet.id, -1)}
                              className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-800 rounded-lg font-black flex items-center justify-center cursor-pointer text-xs shadow-2xs"
                              title="إنقاص عدد النسخ"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-slate-900 font-black text-xs">
                              {getCopies(sheet.id)}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateSheetCopies(sheet.id, 1)}
                              className="w-6 h-6 bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-lg font-black flex items-center justify-center cursor-pointer text-xs shadow-2xs"
                              title="زيادة عدد النسخ"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => isAvailable && handlePrintSheet(sheet)}
                          disabled={!isAvailable}
                          className={`font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
                            isAvailable 
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'اطبع المادة فقط' : 'غير متوفرة'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State Notice when no sheets added yet */
            <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-700">
                <BookOpen className="w-8 h-8 text-emerald-700" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                مكتبة كلية التجارة - جامعة النيلين
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                تم تجهيز الهيكل الأكاديمي للأقسام الثلاثة (<strong>المحاسبة</strong>، <strong>التأمين</strong>، و<strong>إدارة الأعمال</strong>) موزعة على <strong>8 فصول دراسية</strong>.
              </p>
            </div>
          )}
        </>
      )}

      {/* Help Us Provide Sheets Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <FileUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                مساعدتنا في توفير الشيتات والمذكرات
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                شكراً لمبادرتك! يمكنك إرسال الشيتات أو المذكرات الخاصة بـ (<strong>قسم {selectedLeaderDept} - {getSemesterLabel(selectedSemesterNum)}</strong>) مباشرة لفريق المكتبة.
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Direct WhatsApp */}
              <a
                href={`https://wa.me/249119636365?text=${encodeURIComponent(`مرحباً إدارة مكتبة A4 Sudan، أود مساعدتكم في توفير شيتات ومذكرات (قسم ${selectedLeaderDept} - ${getSemesterLabel(selectedSemesterNum)} - كلية التجارة جامعة النيلين)`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer text-center"
              >
                <MessageCircle className="w-5 h-5 text-emerald-200 shrink-0" />
                <span>إرسال الشيتات عبر واتساب المكتبة المباشر 📱</span>
              </a>

              {/* Option 2: Note */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-center">
                <p className="text-[11px] text-slate-600 font-medium">
                  سيتم مراجعة المذكرات والشيتات وفحصها وإضافتها فوراً لجميع زملائك بالجامعة.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer mt-2"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
