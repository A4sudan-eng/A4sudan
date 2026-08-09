package com.example.data

data class AcademicMaterial(
    val id: String,
    val title: String,
    val doctorName: String,
    val pageCount: Int,
    val materialType: String, // "ملزمة شرح", "امتحانات سابقة", "ملخص سريع", "حلول تمارين"
    val isRecommended: Boolean = false
)

data class BatchGroup(
    val id: String,
    val batchNumber: String, // "الدفعة 28", "الدفعة 29", etc.
    val yearLabel: String,  // "دفعة 2018", "دفعة 2019", etc.
    val isMerged: Boolean = false,
    val mergedNotice: String? = null,
    val materials: List<AcademicMaterial>
)

data class ProgramDegree(
    val id: String,
    val name: String, // "بكالوريوس", "دبلوم"
    val batches: List<BatchGroup>
)

data class Department(
    val id: String,
    val name: String, // "محاسبة", "إدارة الأعمال", "تأمين"
    val degrees: List<ProgramDegree>
)

data class Faculty(
    val id: String,
    val name: String, // "كلية التجارة"
    val isAvailable: Boolean = true,
    val departments: List<Department> = emptyList()
)

data class University(
    val id: String,
    val name: String, // "جامعة النيلين"
    val isAvailable: Boolean = true,
    val faculties: List<Faculty> = emptyList()
)

object LibraryRepositoryData {

    val universities = listOf(
        University(
            id = "neelain",
            name = "جامعة النيلين",
            isAvailable = true,
            faculties = listOf(
                Faculty(
                    id = "commerce",
                    name = "كلية التجارة",
                    isAvailable = true,
                    departments = listOf(
                        Department(
                            id = "accounting",
                            name = "قسم المحاسبة",
                            degrees = listOf(
                                createDegree("bachelor_acc", "بكالوريوس المحاسبة"),
                                createDegree("diploma_acc", "دبلوم المحاسبة المالي")
                            )
                        ),
                        Department(
                            id = "business_admin",
                            name = "قسم إدارة الأعمال",
                            degrees = listOf(
                                createDegree("bachelor_bus", "بكالوريوس إدارة الأعمال"),
                                createDegree("diploma_bus", "دبلوم إدارة الأعمال")
                            )
                        ),
                        Department(
                            id = "insurance",
                            name = "قسم التأمين",
                            degrees = listOf(
                                createDegree("bachelor_ins", "بكالوريوس التأمين"),
                                createDegree("diploma_ins", "دبلوم التأمين المصرفي")
                            )
                        )
                    )
                ),
                Faculty(
                    id = "arts",
                    name = "كلية الآداب",
                    isAvailable = false
                ),
                Faculty(
                    id = "law",
                    name = "كلية القانون",
                    isAvailable = false
                ),
                Faculty(
                    id = "economics",
                    name = "كلية الاقتصاد والعلوم الاجتماعية",
                    isAvailable = false
                )
            )
        ),
        University(
            id = "sudan",
            name = "جامعة السودان للعلوم والتكنولوجيا",
            isAvailable = false
        ),
        University(
            id = "khartoum",
            name = "جامعة الخرطوم",
            isAvailable = false
        ),
        University(
            id = "bahri",
            name = "جامعة بحري",
            isAvailable = false
        ),
        University(
            id = "iua",
            name = "جامعة إفريقيا العالمية",
            isAvailable = false
        )
    )

    val alNeelainUniversity: University
        get() = universities.first { it.id == "neelain" }

    private fun createDegree(degreeId: String, degreeTitle: String): ProgramDegree {
        return ProgramDegree(
            id = degreeId,
            name = degreeTitle,
            batches = listOf(
                BatchGroup(
                    id = "${degreeId}_b28",
                    batchNumber = "الدفعة 28",
                    yearLabel = "دفعة 2018",
                    materials = createSampleMaterials("الدفعة 28")
                ),
                BatchGroup(
                    id = "${degreeId}_b29",
                    batchNumber = "الدفعة 29",
                    yearLabel = "دفعة 2019",
                    materials = createSampleMaterials("الدفعة 29")
                ),
                BatchGroup(
                    id = "${degreeId}_b30",
                    batchNumber = "الدفعة 30",
                    yearLabel = "دفعة 2020",
                    materials = createSampleMaterials("الدفعة 30")
                ),
                BatchGroup(
                    id = "${degreeId}_b31",
                    batchNumber = "الدفعة 31",
                    yearLabel = "دفعة 2021",
                    materials = createSampleMaterials("الدفعة 31")
                ),
                BatchGroup(
                    id = "${degreeId}_b32",
                    batchNumber = "الدفعة 32",
                    yearLabel = "دفعة 2022",
                    materials = createSampleMaterials("الدفعة 32")
                ),
                BatchGroup(
                    id = "${degreeId}_b33_34",
                    batchNumber = "الدفعة 33 و 34 (مدمجة)",
                    yearLabel = "دفعة 2023 و 2024",
                    isMerged = true,
                    mergedNotice = "تنبيه هام: تم ضم الدفعتين 33 و 34 في دفعة واحدة بسبب ظروف البلاد واستئناف الدراسة الموحد.",
                    materials = createSampleMaterials("الدفعة 33 و 34 المدمجة")
                )
            )
        )
    }

    private fun createSampleMaterials(batchTag: String): List<AcademicMaterial> {
        return listOf(
            AcademicMaterial(
                id = "${batchTag}_m1",
                title = "ملزمة مبادئ المحاسبة المالية والشابتر 1-4",
                doctorName = "د. عثمان الفاضل",
                pageCount = 38,
                materialType = "ملزمة شرح",
                isRecommended = true
            ),
            AcademicMaterial(
                id = "${batchTag}_m2",
                title = "امتحانات سابقة محلولة مع نماذج الإجابة النموذجية",
                doctorName = "قسم الامتحانات والتقويم",
                pageCount = 22,
                materialType = "امتحانات سابقة",
                isRecommended = true
            ),
            AcademicMaterial(
                id = "${batchTag}_m3",
                title = "محاسبة التكاليف والمحاسبة الإدارية المتقدمة",
                doctorName = "أ.د. عبد الباقي طه",
                pageCount = 45,
                materialType = "ملزمة شرح"
            ),
            AcademicMaterial(
                id = "${batchTag}_m4",
                title = "ملخص القوانين والتمارين المحلولة للرياضيات المالية",
                doctorName = "د. فاطمة الزهراء",
                pageCount = 18,
                materialType = "ملخص سريع"
            )
        )
    }
}
