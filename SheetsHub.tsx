import React, { useState } from 'react';
import { 
  Search, Printer, BookOpen, GraduationCap, Plus, Filter, Building2, 
  Sparkles, Layers, CheckSquare, Square, Check, ChevronLeft, ArrowRight, 
  UserCheck, Award, Users, FolderTree, Landmark, ShieldAlert, ArrowLeft
} from 'lucide-react';
import { StudySheet, PrintFileOptions } from '../types';
import { SAMPLE_STUDY_SHEETS } from '../data/initialData';
import { formatSDG } from '../utils/pricing';
import neelainLogo from '../assets/images/neelain_exact_logo_1785951359550.jpg';

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

  // Active View Mode: 'leader' (دليل الليدر والجامعات) OR 'browse' (المكتبة العامة)
  const [activeMode, setActiveMode] = useState<'leader' | 'browse'>('leader');

  // Leader drill-down navigation steps:
  // 'universities' -> 'colleges' -> 'departments' -> 'degree_tracks' -> 'levels' -> 'semesters' -> 'semester_sheets'
  const [leaderStep, setLeaderStep] = useState<'universities' | 'colleges' | 'departments' | 'degree_tracks' | 'levels' | 'semesters' | 'semester_sheets'>('levels');

  const [selectedUni, setSelectedUni] = useState<string>('جامعة النيلين');
  const [selectedCollege, setSelectedCollege] = useState<string>('كلية التجارة');
  const [selectedLeaderDept, setSelectedLeaderDept] = useState<string | null>('محاسبة');
  const [selectedDegreeTrack, setSelectedDegreeTrack] = useState<'bachelor' | 'diploma' | null>('bachelor');
  const [selectedLevelNum, setSelectedLevelNum] = useState<number | null>(1);
  const [selectedSemesterNum, setSelectedSemesterNum] = useState<number | null>(1);

  // Multi-selection state
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>(() => 
    SAMPLE_STUDY_SHEETS.filter(s => s.isAvailable !== false).map(s => s.id)
  );

  // New sheet contribution form state
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState<'محاسبة' | 'تأمين' | 'إدارة أعمال'>('محاسبة');
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newSubject, setNewSubject] = useState('');
  const [newPageCount, setNewPageCount] = useState(30);
  const [newAuthor, setNewAuthor] = useState('');
  const [newDegreeType, setNewDegreeType] = useState<'bachelor' | 'diploma'>('bachelor');

  const departmentsList = [
    { id: 'all', label: 'جميع الأقسام' },
    { id: 'محاسبة', label: 'قسم المحاسبة' },
    { id: 'تأمين', label: 'قسم التأمين' },
    { id: 'إدارة أعمال', label: 'قسم إدارة الأعمال' },
  ];

  const semestersList = [
    { id: 'all', label: 'جميع الفصول' },
    { id: '1', label: 'الفصل 1 (المستوى 1)' },
    { id: '2', label: 'الفصل 2 (المستوى 1)' },
    { id: '3', label: 'الفصل 3 (المستوى 2)' },
    { id: '4', label: 'الفصل 4 (المستوى 2)' },
    { id: '5', label: 'الفصل 5 (المستوى 3)' },
    { id: '6', label: 'الفصل 6 (المستوى 3)' },
    { id: '7', label: 'الفصل 7 (المستوى 4)' },
    { id: '8', label: 'الفصل 8 (المستوى 4)' },
  ];

  const ACADEMIC_LEVELS = [
    {
      levelNum: 1,
      title: 'المستوى الأول',
      yearLabel: 'السنة الأولى',
      description: 'يحتوي على الفصل الدراسي الأول والفصل الدراسي الثاني',
      badge: 'المستوى 1',
      semesters: [
        { id: 1, title: 'الفصل الدراسي الأول', label: 'الفصل 1', desc: 'مواد ومذكرات الفصل الدراسي الأول' },
        { id: 2, title: 'الفصل الدراسي الثاني', label: 'الفصل 2', desc: 'مواد ومذكرات الفصل الدراسي الثاني' },
      ],
    },
    {
      levelNum: 2,
      title: 'المستوى الثاني',
      yearLabel: 'السنة الثانية',
      description: 'يحتوي على الفصل الدراسي الثالث والفصل الدراسي الرابع',
      badge: 'المستوى 2',
      semesters: [
        { id: 3, title: 'الفصل الدراسي الثالث', label: 'الفصل 3', desc: 'مواد ومذكرات الفصل الدراسي الثالث' },
        { id: 4, title: 'الفصل الدراسي الرابع', label: 'الفصل 4', desc: 'مواد ومذكرات الفصل الدراسي الرابع' },
      ],
    },
    {
      levelNum: 3,
      title: 'المستوى الثالث',
      yearLabel: 'السنة الثالثة',
      description: 'يحتوي على الفصل الدراسي الخامس والفصل الدراسي السادس',
      badge: 'المستوى 3',
      semesters: [
        { id: 5, title: 'الفصل الدراسي الخامس', label: 'الفصل 5', desc: 'مواد ومذكرات الفصل الدراسي الخامس' },
        { id: 6, title: 'الفصل الدراسي السادس', label: 'الفصل 6', desc: 'مواد ومذكرات الفصل الدراسي السادس' },
      ],
    },
    {
      levelNum: 4,
      title: 'المستوى الرابع',
      yearLabel: 'السنة الرابعة (سنة التخرج)',
      description: 'يحتوي على الفصل الدراسي السابع والفصل الدراسي الثامن',
      badge: 'المستوى 4 (التخرج)',
      semesters: [
        { id: 7, title: 'الفصل الدراسي السابع', label: 'الفصل 7', desc: 'مواد ومذكرات الفصل الدراسي السابع' },
        { id: 8, title: 'الفصل الدراسي الثامن', label: 'الفصل 8', desc: 'مواد ومذكرات الفصل الدراسي الثامن (التخرج)' },
      ],
    },
  ];

  // Helper to get semester display title
  const getSemesterLabel = (semNum: number | null) => {
    if (!semNum) return 'جميع الفصول الدراسية';
    for (const level of ACADEMIC_LEVELS) {
      const sem = level.semesters.find(s => s.id === semNum);
      if (sem) {
        return `${sem.title} (${level.title})`;
      }
    }
    return `الفصل الدراسي ${semNum}`;
  };

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
    const matchesDept = !selectedLeaderDept || sheet.department === selectedLeaderDept;
    const matchesDegree = !selectedDegreeTrack || !sheet.degreeType || sheet.degreeType === selectedDegreeTrack;
    const matchesSemester = !selectedSemesterNum || sheet.semester === selectedSemesterNum;
    return matchesDept && matchesDegree && matchesSemester;
  });

  const activeSheetsInView = activeMode === 'leader' && leaderStep === 'semester_sheets' ? leaderFilteredSheets : filteredSheets;
  const availableFilteredSheets = activeSheetsInView.filter(s => s.isAvailable !== false);
  const selectedSheetsInView = availableFilteredSheets.filter(s => selectedSheetIds.includes(s.id));
  const selectedTotalPrice = selectedSheetsInView.reduce((sum, s) => sum + s.priceEstimate, 0);

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
    const college = sheet.facultyOrYear || selectedCollege || 'كلية التجارة';
    const dept = sheet.department ? `قسم ${sheet.department}` : 'جميع الأقسام';
    const degree = sheet.degreeType === 'diploma' ? 'دبلوم تقني' : 'بكالوريوس';
    const sem = sheet.semester ? `الفصل الدراسي ${sheet.semester}` : getSemesterLabel(selectedSemesterNum);
    
    return `${uni} ⬅️ ${college} ⬅️ ${dept} ⬅️ ${degree} ⬅️ ${sem}`;
  };

  const handlePrintSheet = (sheet: StudySheet) => {
    const hierarchy = buildSheetHierarchyPath(sheet);
    onSelectSheetForPrint({
      fileName: `${sheet.title}.pdf`,
      pageCount: sheet.pageCount || 40,
      color: sheet.recommendedColor,
      binding: sheet.recommendedBinding,
      sides: 'double',
      copies: 1,
      notes: `شيت من مكتبة الكلية ودليل الليدر | المسار الأكاديمي: (${hierarchy}) | دكتور المادة: ${sheet.authorOrLecturer || 'معتمد'}`,
    });
  };

  const handlePrintSelectedSheets = () => {
    if (selectedSheetsInView.length === 0) {
      alert('الرجاء تحديد مادة واحدة على الأقل للطباعة!');
      return;
    }

    const optionsList: Partial<PrintFileOptions>[] = selectedSheetsInView.map(sheet => {
      const hierarchy = buildSheetHierarchyPath(sheet);
      return {
        fileName: `${sheet.title}.pdf`,
        pageCount: sheet.pageCount || 40,
        color: sheet.recommendedColor,
        binding: sheet.recommendedBinding,
        sides: 'double',
        copies: 1,
        notes: `شيت من دليل الليدر | المسار: (${hierarchy}) | دكتور المادة: ${sheet.authorOrLecturer || 'معتمد'}`,
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
      facultyOrYear: 'كلية التجارة',
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
    alert('تمت إضافة الشيت إلى مكتبة الكلية ودليل الليدر بنجاح!');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Compact Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white rounded-2xl px-5 py-3.5 mb-4 border border-emerald-700/60 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-800/90 rounded-xl flex items-center justify-center text-amber-300 font-bold border border-emerald-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>مكتبة الجامعات السودانية</span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                الشيتات والمذكرات
              </span>
            </h1>
            <p className="text-emerald-200/80 text-xs hidden sm:block">
              تصفح الجامعات والكليات والأقسام والفصول الدراسية للوصول لكافة الشيتات المعتمدة
            </p>
          </div>
        </div>

        {/* Quick University Badge */}
        <div className="hidden md:flex items-center gap-2 bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700/60 text-xs shrink-0">
          <img 
            src={neelainLogo} 
            alt="جامعة النيلين" 
            className="w-6 h-6 object-contain rounded bg-white p-0.5"
          />
          <span className="font-bold text-emerald-100">جامعة النيلين • كلية التجارة</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEADER SECTION (قسم الليدر والجامعات والفصول الدراسية)                   */}
      {/* ========================================================================= */}
      {activeMode === 'leader' && (
        <div className="space-y-5 mb-10">
          
          {/* Prominent & Highly Visible Navigation / Breadcrumbs Bar */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border-2 border-emerald-600/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
              <span className="text-emerald-900 font-black flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>مسار الملاحة:</span>
              </span>

              {/* All Universities / Change University Button */}
              <button 
                onClick={() => setLeaderStep('universities')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  leaderStep === 'universities' 
                    ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                }`}
              >
                <span>جميع الجامعات</span>
              </button>

              {leaderStep !== 'universities' && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <button 
                    onClick={() => setLeaderStep('colleges')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      leaderStep === 'colleges' 
                        ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                    }`}
                  >
                    {selectedUni}
                  </button>
                </>
              )}

              {(leaderStep === 'departments' || leaderStep === 'degree_tracks' || leaderStep === 'levels' || leaderStep === 'semesters' || leaderStep === 'semester_sheets') && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <button 
                    onClick={() => setLeaderStep('departments')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      leaderStep === 'departments' 
                        ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                    }`}
                  >
                    {selectedCollege}
                  </button>
                </>
              )}

              {(leaderStep === 'degree_tracks' || leaderStep === 'levels' || leaderStep === 'semesters' || leaderStep === 'semester_sheets') && selectedLeaderDept && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <button 
                    onClick={() => setLeaderStep('degree_tracks')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      leaderStep === 'degree_tracks' 
                        ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                    }`}
                  >
                    قسم {selectedLeaderDept}
                  </button>
                </>
              )}

              {(leaderStep === 'levels' || leaderStep === 'semesters' || leaderStep === 'semester_sheets') && selectedDegreeTrack && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <button 
                    onClick={() => setLeaderStep('levels')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      leaderStep === 'levels' 
                        ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                    }`}
                  >
                    المستويات الأكاديمية
                  </button>
                </>
              )}

              {(leaderStep === 'semesters' || leaderStep === 'semester_sheets') && selectedLevelNum && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <button 
                    onClick={() => setLeaderStep('semesters')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      leaderStep === 'semesters' 
                        ? 'bg-emerald-800 text-amber-300 font-black shadow-sm ring-2 ring-emerald-600' 
                        : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 font-bold border border-slate-200'
                    }`}
                  >
                    {ACADEMIC_LEVELS.find(l => l.levelNum === selectedLevelNum)?.title || `المستوى ${selectedLevelNum}`}
                  </button>
                </>
              )}

              {leaderStep === 'semester_sheets' && selectedSemesterNum && (
                <>
                  <ChevronLeft className="w-4 h-4 text-emerald-600 font-bold" />
                  <span className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-black shadow-xs">
                    {getSemesterLabel(selectedSemesterNum)}
                  </span>
                </>
              )}
            </div>

            {/* Direct Button to Switch University */}
            {leaderStep !== 'universities' && (
              <button
                onClick={() => setLeaderStep('universities')}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-emerald-300 shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>تغيير الجامعة</span>
              </button>
            )}
          </div>

          {/* STEP 1: UNIVERSITIES LIST (الجامعات) */}
          {leaderStep === 'universities' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <span>جميع الجامعات المتاحة</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    اختر الجامعة لعرض الكليات والأقسام
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                  جامعة 1 متوفرة
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Active University: Al Neelain University */}
                <div 
                  onClick={() => {
                    setSelectedUni('جامعة النيلين');
                    setLeaderStep('colleges');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-3.5 shadow-sm border border-emerald-500 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-10 h-10 bg-white p-1 rounded-xl shadow-xs border border-emerald-400/40 shrink-0">
                        <img src={neelainLogo} alt="جامعة النيلين" className="w-full h-full object-contain" />
                      </div>
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                        متوفرة حالياً ✓
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      جامعة النيلين
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      كلية التجارة والأقسام الأكاديمية كاملة
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                    <span>دخول الكليات</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Coming Soon Universities */}
                {['جامعة الخرطوم', 'جامعة السودان للعلوم والتكنولوجيا', 'جامعة بحري'].map((uniName, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 opacity-75 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="bg-slate-200 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          قريباً ⏳
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-700">{uniName}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">جاري إعداد الشيتات...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: COLLEGES LIST (كليات الجامعة) */}
          {leaderStep === 'colleges' && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
                      <span>{selectedUni} • اختر الكلية</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      الكليات المعتمدة في {selectedUni}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Active College: Faculty of Commerce */}
                <div 
                  onClick={() => {
                    setSelectedCollege('كلية التجارة');
                    setLeaderStep('departments');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-3.5 shadow-sm border border-emerald-500 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-800/80 rounded-lg flex items-center justify-center text-emerald-200 font-bold border border-emerald-600/50 shrink-0">
                        <FolderTree className="w-4 h-4 text-amber-300" />
                      </div>
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                        متوفرة حالياً ✓
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                      كلية التجارة
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      المحاسبة، إدارة الأعمال، والتأمين
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                    <span>عرض الأقسام</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Coming Soon Colleges */}
                {['كلية القانون', 'كلية العلوم الإدارية', 'كلية الآداب'].map((colName, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 opacity-75 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <span className="bg-slate-200 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          قريباً ⏳
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-700">{colName}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">سيتم رفع مذكراتها قريباً...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: DEPARTMENTS LIST (أقسام كلية التجارة) */}
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
                      الأقسام المعتمدة بكلية التجارة - جامعة النيلين
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Accounting Dept */}
                <div 
                  onClick={() => {
                    setSelectedLeaderDept('محاسبة');
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
                        قسم المحاسبة
                      </h3>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      مستودع شيتات ومذكرات وتكاليف قسم المحاسبة لكافة الدفعات
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                    <span>اختيار البكالوريوس/الدبلوم</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Business Administration Dept */}
                <div 
                  onClick={() => {
                    setSelectedLeaderDept('إدارة أعمال');
                    setLeaderStep('degree_tracks');
                  }}
                  className="bg-emerald-900 text-white rounded-xl p-3.5 shadow-sm border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-amber-300 font-black border border-emerald-600/60 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                        قسم إدارة الأعمال
                      </h3>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      شيتات ومواد إدارة التنظيم والتسويق والموارد البشرية
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                    <span>اختيار البكالوريوس/الدبلوم</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Insurance Dept */}
                <div 
                  onClick={() => {
                    setSelectedLeaderDept('تأمين');
                    setLeaderStep('degree_tracks');
                  }}
                  className="bg-emerald-900 text-white rounded-xl p-3.5 shadow-sm border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-emerald-800 rounded-lg flex items-center justify-center text-amber-300 font-black border border-emerald-600/60 shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                        قسم التأمين
                      </h3>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 leading-tight">
                      مذكرات ومواد إدارة المخاطر والتأمين التجاري والإسلامي
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-800/80 text-[11px] font-bold text-emerald-300">
                    <span>اختيار البكالوريوس/الدبلوم</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DEGREE TRACKS (بكالوريوس / دبلوم تقني) */}
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
                      <span>قسم {selectedLeaderDept} • اختر الدرجة العلمية</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر المسار الأكاديمي لعرض الفصول الدراسية الخاصة به
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {/* 1. Bachelor Track */}
                <div 
                  onClick={() => {
                    setSelectedDegreeTrack('bachelor');
                    setLeaderStep('levels');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-4 border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group text-center space-y-2 shadow-sm"
                >
                  <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-amber-300 mx-auto border border-emerald-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    بكالوريوس
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    4 مستويات دراسية (8 فصول)
                  </p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-xs">
                    <span>عرض المستويات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>

                {/* 2. Technical Diploma Track */}
                <div 
                  onClick={() => {
                    setSelectedDegreeTrack('diploma');
                    setLeaderStep('levels');
                  }}
                  className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white rounded-xl p-4 border border-emerald-600 hover:border-amber-400 transition-all cursor-pointer group text-center space-y-2 shadow-sm"
                >
                  <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center text-amber-300 mx-auto border border-emerald-600">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                    دبلوم تقني
                  </h3>
                  <p className="text-xs text-emerald-200/90">
                    مستويان دراسيان (4 فصول)
                  </p>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-950 font-black rounded-lg text-xs">
                    <span>عرض المستويات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ACADEMIC LEVELS (المستويات الأربعة) */}
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
                      <span>المستويات الأكاديمية (كلية التجارة - قسم {selectedLeaderDept} - {selectedDegreeTrack === 'bachelor' ? 'بكالوريوس' : 'دبلوم تقني'})</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر المستوى الأكاديمي لعرض الفصول الدراسية
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ACADEMIC_LEVELS
                  .filter(lvl => selectedDegreeTrack === 'diploma' ? lvl.levelNum <= 2 : true)
                  .map((lvl) => (
                    <div
                      key={lvl.levelNum}
                      onClick={() => {
                        setSelectedLevelNum(lvl.levelNum);
                        setLeaderStep('semesters');
                      }}
                      className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border border-emerald-600/80 hover:border-amber-400 rounded-xl p-3.5 transition-all cursor-pointer group shadow-xs flex flex-col justify-between space-y-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="bg-amber-400 text-slate-950 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-xs">
                            {lvl.badge}
                          </span>
                          <span className="text-[10px] text-emerald-300 font-bold">
                            {lvl.yearLabel}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          {lvl.title}
                        </h3>
                        <p className="text-[11px] text-emerald-100/85 leading-tight">
                          {lvl.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-bold text-amber-300 group-hover:translate-x-[-2px] transition-transform">
                        <span>عرض الفصول</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                ))}
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
                        فصول {ACADEMIC_LEVELS.find(l => l.levelNum === selectedLevelNum)?.title || `المستوى ${selectedLevelNum}`} ({ACADEMIC_LEVELS.find(l => l.levelNum === selectedLevelNum)?.yearLabel})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      اختر الفصل الدراسي لعرض الشيتات والمذكرات المقررة
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(ACADEMIC_LEVELS.find(l => l.levelNum === selectedLevelNum)?.semesters || []).map((sem) => (
                  <div
                    key={sem.id}
                    onClick={() => {
                      setSelectedSemesterNum(sem.id);
                      setLeaderStep('semester_sheets');
                    }}
                    className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white border border-emerald-600 hover:border-amber-400 rounded-xl p-3.5 transition-all cursor-pointer group shadow-xs flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-md shadow-xs">
                          {sem.label}
                        </span>
                        <span className="text-[11px] text-emerald-300 font-bold">
                          قسم {selectedLeaderDept}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                        {sem.title}
                      </h3>
                      <p className="text-[11px] text-emerald-100/90 leading-tight">
                        {sem.desc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-bold text-amber-300">
                      <span>عرض مواد الفصل</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: SEMESTER SHEETS (عرض الشيتات والمواد للفصل الدراسي المختار) */}
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
                      شيتات ومذكرات {getSemesterLabel(selectedSemesterNum)}
                    </h2>
                    <p className="text-[11px] text-emerald-200">
                      قسم {selectedLeaderDept} • {selectedDegreeTrack === 'bachelor' ? 'بكالوريوس' : 'دبلوم تقني'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLeaderStep('levels')}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>تغيير المستوى</span>
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

              {/* Sheets Grid - Compact Cards */}
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
                            <p className="truncate">المادة: <strong className="text-slate-700">{sheet.subject}</strong> (قسم {sheet.department})</p>
                            {sheet.authorOrLecturer && (
                              <p className="truncate">المحاضر: <strong className="text-slate-700">{sheet.authorOrLecturer}</strong></p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                          <div>
                            <span className="text-[10px] text-slate-400 block">السعر:</span>
                            <strong className="text-emerald-900 font-black text-sm sm:text-base">
                              {formatSDG(sheet.priceEstimate)}
                            </strong>
                          </div>

                          <button
                            onClick={() => isAvailable && handlePrintSheet(sheet)}
                            disabled={!isAvailable}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>اطبع</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-700">
                    <BookOpen className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    {getSemesterLabel(selectedSemesterNum)} - كلية التجارة
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    تم تجهيز هذا الفصل الدراسي لـ (<strong>قسم {selectedLeaderDept}</strong>). يمكنك إضافة الشيتات أو المذكرات لتجهيزها وطباعتها فوراً!
                  </p>

                  <button
                    onClick={() => {
                      setNewDept((selectedLeaderDept as any) || 'محاسبة');
                      setNewDegreeType(selectedDegreeTrack || 'bachelor');
                      setNewSemester(selectedSemesterNum || 1);
                      setShowUploadModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول شيت لـ {getSemesterLabel(selectedSemesterNum)}</span>
                  </button>
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
                          <div className="flex justify-between">
                            <span>نوع الطباعة والتغليف:</span>
                            <strong className="text-slate-800">أبيض وأسود + سلك حلزوني</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-100 text-xs text-rose-800 font-bold mb-4">
                          هذه المادة غير متوفرة حالياً في المكتبة، وسوف تضاف فور إعدادها.
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                      <div>
                        <span className="text-[11px] text-slate-400 block">السعر:</span>
                        {isAvailable ? (
                          <strong className="text-emerald-900 font-black text-base sm:text-lg">
                            {formatSDG(sheet.priceEstimate)}
                          </strong>
                        ) : (
                          <strong className="text-rose-600 font-bold text-sm">
                            غير متوفرة
                          </strong>
                        )}
                      </div>

                      <button
                        onClick={() => isAvailable && handlePrintSheet(sheet)}
                        disabled={!isAvailable}
                        className={`font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm ${
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

    </div>
  );
};
