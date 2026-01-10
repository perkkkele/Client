/**
 * Autocorrección y Normalización de Profesiones para TwinPro
 * 
 * Este módulo corrige automáticamente:
 * - Errores ortográficos comunes (psicologo → psicólogo)
 * - Variantes de género (mantiene el género original pero con ortografía correcta)
 * - Mayúsculas/minúsculas (normaliza a formato título)
 * - Espacios en blanco extra
 */

// Diccionario de profesiones con sus formas canónicas
// Clave: forma normalizada sin acentos y en minúsculas
// Valor: { masculine: forma correcta masculina, feminine: forma correcta femenina }
interface ProfessionVariants {
    masculine: string;
    feminine: string;
}

const PROFESSION_DICTIONARY: Record<string, ProfessionVariants> = {
    // --- SALUD ---
    'medico': { masculine: 'Médico', feminine: 'Médica' },
    'doctor': { masculine: 'Doctor', feminine: 'Doctora' },
    'doctora': { masculine: 'Doctor', feminine: 'Doctora' },
    'enfermero': { masculine: 'Enfermero', feminine: 'Enfermera' },
    'enfermera': { masculine: 'Enfermero', feminine: 'Enfermera' },
    'dentista': { masculine: 'Dentista', feminine: 'Dentista' }, // Neutro
    'odontologo': { masculine: 'Odontólogo', feminine: 'Odontóloga' },
    'psicologo': { masculine: 'Psicólogo', feminine: 'Psicóloga' },
    'psiquiatra': { masculine: 'Psiquiatra', feminine: 'Psiquiatra' }, // Neutro
    'fisioterapeuta': { masculine: 'Fisioterapeuta', feminine: 'Fisioterapeuta' }, // Neutro
    'terapeuta': { masculine: 'Terapeuta', feminine: 'Terapeuta' }, // Neutro
    'nutricionista': { masculine: 'Nutricionista', feminine: 'Nutricionista' }, // Neutro
    'nutriologo': { masculine: 'Nutriólogo', feminine: 'Nutrióloga' },
    'cardiologo': { masculine: 'Cardiólogo', feminine: 'Cardióloga' },
    'dermatologo': { masculine: 'Dermatólogo', feminine: 'Dermatóloga' },
    'ginecologo': { masculine: 'Ginecólogo', feminine: 'Ginecóloga' },
    'pediatra': { masculine: 'Pediatra', feminine: 'Pediatra' }, // Neutro
    'neurologo': { masculine: 'Neurólogo', feminine: 'Neuróloga' },
    'traumatologo': { masculine: 'Traumatólogo', feminine: 'Traumatóloga' },
    'urologo': { masculine: 'Urólogo', feminine: 'Uróloga' },
    'oftalmologo': { masculine: 'Oftalmólogo', feminine: 'Oftalmóloga' },
    'otorrinolaringologo': { masculine: 'Otorrinolaringólogo', feminine: 'Otorrinolaringóloga' },
    'radiologo': { masculine: 'Radiólogo', feminine: 'Radióloga' },
    'anestesiologo': { masculine: 'Anestesiólogo', feminine: 'Anestesióloga' },
    'cirujano': { masculine: 'Cirujano', feminine: 'Cirujana' },
    'veterinario': { masculine: 'Veterinario', feminine: 'Veterinaria' },
    'logopeda': { masculine: 'Logopeda', feminine: 'Logopeda' }, // Neutro
    'podologo': { masculine: 'Podólogo', feminine: 'Podóloga' },
    'osteopata': { masculine: 'Osteópata', feminine: 'Osteópata' }, // Neutro
    'quiromasajista': { masculine: 'Quiromasajista', feminine: 'Quiromasajista' }, // Neutro
    'masajista': { masculine: 'Masajista', feminine: 'Masajista' }, // Neutro

    // --- LEGAL ---
    'abogado': { masculine: 'Abogado', feminine: 'Abogada' },
    'notario': { masculine: 'Notario', feminine: 'Notaria' },
    'procurador': { masculine: 'Procurador', feminine: 'Procuradora' },
    'asesor fiscal': { masculine: 'Asesor Fiscal', feminine: 'Asesora Fiscal' },
    'gestor': { masculine: 'Gestor', feminine: 'Gestora' },
    'mediador': { masculine: 'Mediador', feminine: 'Mediadora' },

    // --- FITNESS ---
    'entrenador personal': { masculine: 'Entrenador Personal', feminine: 'Entrenadora Personal' },
    'entrenador': { masculine: 'Entrenador', feminine: 'Entrenadora' },
    'preparador fisico': { masculine: 'Preparador Físico', feminine: 'Preparadora Física' },
    'monitor': { masculine: 'Monitor', feminine: 'Monitora' },
    'instructor': { masculine: 'Instructor', feminine: 'Instructora' },

    // --- BIENESTAR ---
    'coach': { masculine: 'Coach', feminine: 'Coach' }, // Neutro (anglicismo)
    'psicoterapeuta': { masculine: 'Psicoterapeuta', feminine: 'Psicoterapeuta' }, // Neutro
    'hipnoterapeuta': { masculine: 'Hipnoterapeuta', feminine: 'Hipnoterapeuta' }, // Neutro
    'acupunturista': { masculine: 'Acupunturista', feminine: 'Acupunturista' }, // Neutro
    'naturópata': { masculine: 'Naturópata', feminine: 'Naturópata' }, // Neutro
    'naturopata': { masculine: 'Naturópata', feminine: 'Naturópata' },

    // --- INMOBILIARIO ---
    'agente inmobiliario': { masculine: 'Agente Inmobiliario', feminine: 'Agente Inmobiliaria' },
    'corredor de bienes raices': { masculine: 'Corredor de Bienes Raíces', feminine: 'Corredora de Bienes Raíces' },
    'administrador de fincas': { masculine: 'Administrador de Fincas', feminine: 'Administradora de Fincas' },

    // --- ESTÉTICA ---
    'peluquero': { masculine: 'Peluquero', feminine: 'Peluquera' },
    'estilista': { masculine: 'Estilista', feminine: 'Estilista' }, // Neutro
    'esteticista': { masculine: 'Esteticista', feminine: 'Esteticista' }, // Neutro
    'esteticien': { masculine: 'Esteticién', feminine: 'Esteticién' }, // Neutro
    'maquillador': { masculine: 'Maquillador', feminine: 'Maquilladora' },
    'manicurista': { masculine: 'Manicurista', feminine: 'Manicurista' }, // Neutro
    'barbero': { masculine: 'Barbero', feminine: 'Barbera' },
    'tatuador': { masculine: 'Tatuador', feminine: 'Tatuadora' },

    // --- HOGAR ---
    'electricista': { masculine: 'Electricista', feminine: 'Electricista' }, // Neutro
    'fontanero': { masculine: 'Fontanero', feminine: 'Fontanera' },
    'plomero': { masculine: 'Plomero', feminine: 'Plomera' },
    'carpintero': { masculine: 'Carpintero', feminine: 'Carpintera' },
    'pintor': { masculine: 'Pintor', feminine: 'Pintora' },
    'albanil': { masculine: 'Albañil', feminine: 'Albañil' }, // Neutro
    'cerrajero': { masculine: 'Cerrajero', feminine: 'Cerrajera' },
    'jardinero': { masculine: 'Jardinero', feminine: 'Jardinera' },
    'decorador': { masculine: 'Decorador', feminine: 'Decoradora' },
    'interiorista': { masculine: 'Interiorista', feminine: 'Interiorista' }, // Neutro

    // --- EDUCACIÓN ---
    'profesor': { masculine: 'Profesor', feminine: 'Profesora' },
    'maestro': { masculine: 'Maestro', feminine: 'Maestra' },
    'tutor': { masculine: 'Tutor', feminine: 'Tutora' },
    'pedagogo': { masculine: 'Pedagogo', feminine: 'Pedagoga' },
    'educador': { masculine: 'Educador', feminine: 'Educadora' },
    'formador': { masculine: 'Formador', feminine: 'Formadora' },

    // --- TECNOLOGÍA ---
    'programador': { masculine: 'Programador', feminine: 'Programadora' },
    'desarrollador': { masculine: 'Desarrollador', feminine: 'Desarrolladora' },
    'ingeniero': { masculine: 'Ingeniero', feminine: 'Ingeniera' },
    'informatico': { masculine: 'Informático', feminine: 'Informática' },
    'tecnico': { masculine: 'Técnico', feminine: 'Técnica' },
    'analista': { masculine: 'Analista', feminine: 'Analista' }, // Neutro
    'consultor': { masculine: 'Consultor', feminine: 'Consultora' },

    // --- DISEÑO ---
    'disenador': { masculine: 'Diseñador', feminine: 'Diseñadora' },
    'disenador grafico': { masculine: 'Diseñador Gráfico', feminine: 'Diseñadora Gráfica' },
    'arquitecto': { masculine: 'Arquitecto', feminine: 'Arquitecta' },
    'ilustrador': { masculine: 'Ilustrador', feminine: 'Ilustradora' },
    'fotografo': { masculine: 'Fotógrafo', feminine: 'Fotógrafa' },

    // --- FINANZAS ---
    'economista': { masculine: 'Economista', feminine: 'Economista' }, // Neutro
    'contable': { masculine: 'Contable', feminine: 'Contable' }, // Neutro
    'contador': { masculine: 'Contador', feminine: 'Contadora' },
    'auditor': { masculine: 'Auditor', feminine: 'Auditora' },
    'asesor financiero': { masculine: 'Asesor Financiero', feminine: 'Asesora Financiera' },
    'broker': { masculine: 'Broker', feminine: 'Broker' }, // Neutro (anglicismo)

    // --- EMPLEO ---
    'reclutador': { masculine: 'Reclutador', feminine: 'Reclutadora' },
    'headhunter': { masculine: 'Headhunter', feminine: 'Headhunter' }, // Neutro (anglicismo)
};

// Alias y errores comunes que mapean a la forma base
const COMMON_ALIASES: Record<string, string> = {
    // Variantes con/sin tilde y errores comunes
    'sicólogo': 'psicologo',
    'sicologo': 'psicologo',
    'sicóloga': 'psicologo',
    'sicologa': 'psicologo',
    'psycologo': 'psicologo',
    'psicoligo': 'psicologo',

    'mediko': 'medico',

    'abogao': 'abogado',

    'odontologo': 'dentista',
    'odontóloga': 'dentista',

    'fisio': 'fisioterapeuta',

    'personal trainer': 'entrenador personal',
    'pt': 'entrenador personal',
    'trainer': 'entrenador personal',

    'nutri': 'nutricionista',
    'nutriologo': 'nutricionista',

    'pelu': 'peluquero',
    'estética': 'esteticista',
    'estetica': 'esteticista',

    'archi': 'arquitecto',
    'arqui': 'arquitecto',

    'profe': 'profesor',

    'dev': 'desarrollador',
    'developer': 'desarrollador',
    'software': 'programador',

    'diseñador': 'disenador',
    'fotografo': 'fotografo',
    'grafico': 'disenador grafico',
};

/**
 * Elimina acentos de un string para comparación
 */
function removeAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detecta si una palabra parece ser femenina basándose en su terminación
 */
function isFeminine(word: string): boolean {
    const lowerWord = word.toLowerCase().trim();

    // Profesiones neutras que terminan en 'a' pero no son femeninas
    const neutralEndings = ['ista', 'euta', 'atra', 'ta', 'coach', 'broker'];
    if (neutralEndings.some(ending => lowerWord.endsWith(ending))) {
        return false;
    }

    // Terminaciones típicamente femeninas
    const feminineEndings = ['a', 'ora', 'era', 'óloga', 'ologa', 'ada', 'ica'];
    return feminineEndings.some(ending => lowerWord.endsWith(ending));
}

/**
 * Normaliza una profesión a su forma base (sin acentos, minúsculas, sin espacios extra)
 */
function normalizeToBase(profession: string): string {
    return removeAccents(profession)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' '); // Múltiples espacios a uno solo
}

/**
 * Convierte forma femenina a masculina para búsqueda en diccionario
 */
function toMasculineBase(normalized: string): string {
    // Patrones de terminaciones femeninas → masculinas
    const patterns: [RegExp, string][] = [
        [/ologa$/, 'ologo'],      // psicóloga → psicólogo
        [/ora$/, 'or'],           // doctora → doctor
        [/era$/, 'ero'],          // enfermera → enfermero
        [/ada$/, 'ado'],          // abogada → abogado
        [/ica$/, 'ico'],          // médica → médico
        [/ina$/, 'ino'],          // veterinaria → veterinario (si aplica)
    ];

    for (const [pattern, replacement] of patterns) {
        if (pattern.test(normalized)) {
            return normalized.replace(pattern, replacement);
        }
    }

    return normalized;
}

/**
 * Autocorrige y normaliza una profesión ingresada por el usuario
 * 
 * @param input - La profesión tal como la escribió el usuario
 * @returns La profesión corregida con ortografía correcta y formato adecuado
 * 
 * @example
 * normalizeProfession("psicologo") → "Psicólogo"
 * normalizeProfession("PSICÓLOGA ") → "Psicóloga"
 * normalizeProfession("sicologo") → "Psicólogo"
 */
export function normalizeProfession(input: string): string {
    if (!input || typeof input !== 'string') {
        return input;
    }

    // 1. Limpiar espacios extra
    const cleaned = input.trim().replace(/\s+/g, ' ');
    if (!cleaned) return input;

    // 2. Detectar si el input parece femenino
    const seemsFeminine = isFeminine(cleaned);

    // 3. Normalizar a forma base para búsqueda
    const baseForm = normalizeToBase(cleaned);

    // 4. Buscar en alias primero (para errores comunes)
    let lookupKey = COMMON_ALIASES[baseForm] || baseForm;

    // 5. Si no se encuentra, intentar con forma masculina
    if (!PROFESSION_DICTIONARY[lookupKey]) {
        lookupKey = toMasculineBase(lookupKey);
    }

    // 6. Buscar en el diccionario
    const profession = PROFESSION_DICTIONARY[lookupKey];

    if (profession) {
        // Devolver la forma correcta según el género detectado
        return seemsFeminine ? profession.feminine : profession.masculine;
    }

    // 7. Si no está en el diccionario, devolver con formato título
    return cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Verifica si una profesión está en el diccionario de TwinPro
 */
export function isKnownProfession(input: string): boolean {
    const baseForm = normalizeToBase(input);
    const lookupKey = COMMON_ALIASES[baseForm] || toMasculineBase(baseForm);
    return lookupKey in PROFESSION_DICTIONARY;
}

/**
 * Obtiene sugerencias de profesiones similares
 */
export function getProfessionSuggestions(input: string, maxResults: number = 5): string[] {
    const baseForm = normalizeToBase(input);
    const suggestions: string[] = [];

    for (const [key, variants] of Object.entries(PROFESSION_DICTIONARY)) {
        if (key.includes(baseForm) || baseForm.includes(key)) {
            suggestions.push(variants.masculine);
            if (suggestions.length >= maxResults) break;
        }
    }

    return suggestions;
}

export default normalizeProfession;
