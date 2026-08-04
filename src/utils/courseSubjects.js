// Definição completa das cadeiras por curso, ano e semestre, com suporte a Role IDs por ano, semestre e cadeira
export const COURSE_SUBJECTS = {
  lei: {
    name: 'LEI - Licenciatura em Engenharia Informática',
    hasYearSelection: true,
    years: [
      {
        id: '1',
        label: '1º Ano',
        roleId: process.env.LEI_YEAR_1_ROLE_ID || '', // ID do Cargo do 1º Ano de LEI (opcional)
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.LEI_YEAR_1_SEM_1_ROLE_ID || '', // ID do Cargo do 1º Semestre do 1º Ano (opcional)
            allKey: 'all_lei_1_s1',
            subjects: [
              { id: 'lei_al', name: 'Álgebra Linear', roleId: process.env.LEI_AL_ROLE_ID || '' },
              { id: 'lei_am1', name: 'Análise Matemática I', roleId: process.env.LEI_AM1_ROLE_ID || '' },
              { id: 'lei_md', name: 'Matemática Discreta', roleId: process.env.LEI_MD_ROLE_ID || '' },
              { id: 'lei_pi', name: 'Programação Imperativa', roleId: process.env.LEI_PI_ROLE_ID || '' },
              { id: 'lei_sd', name: 'Sistemas Digitais', roleId: process.env.LEI_SD_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.LEI_YEAR_1_SEM_2_ROLE_ID || '', // ID do Cargo do 2º Semestre do 1º Ano (opcional)
            allKey: 'all_lei_1_s2',
            subjects: [
              { id: 'lei_am2', name: 'Análise Matemática II', roleId: process.env.LEI_AM2_ROLE_ID || '' },
              { id: 'lei_ac', name: 'Arquitetura de Computadores', roleId: process.env.LEI_AC_ROLE_ID || '' },
              { id: 'lei_f1', name: 'Física 1', roleId: process.env.LEI_F1_ROLE_ID || '' },
              { id: 'lei_lp', name: 'Laboratório de Programação', roleId: process.env.LEI_LP_ROLE_ID || '' },
              { id: 'lei_pe', name: 'Probabilidades e Estatística', roleId: process.env.LEI_PE_ROLE_ID || '' }
            ]
          }
        ]
      },
      {
        id: '2',
        label: '2º Ano',
        roleId: process.env.LEI_YEAR_2_ROLE_ID || '', // ID do Cargo do 2º Ano de LEI (opcional)
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.LEI_YEAR_2_SEM_1_ROLE_ID || '', // ID do Cargo do 1º Semestre do 2º Ano (opcional)
            allKey: 'all_lei_2_s1',
            subjects: [
              { id: 'lei_aed', name: 'Algoritmos e Estruturas de Dados', roleId: process.env.LEI_AED_ROLE_ID || '' },
              { id: 'lei_bd', name: 'Bases de Dados', roleId: process.env.LEI_BD_ROLE_ID || '' },
              { id: 'lei_an', name: 'Análise Numérica', roleId: process.env.LEI_AN_ROLE_ID || '' },
              { id: 'lei_em', name: 'Empreendedorismo', roleId: process.env.LEI_EM_ROLE_ID || '' },
              { id: 'lei_f2', name: 'Física 2', roleId: process.env.LEI_F2_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.LEI_YEAR_2_SEM_2_ROLE_ID || '', // ID do Cargo do 2º Semestre do 2º Ano (opcional)
            allKey: 'all_lei_2_s2',
            subjects: [
              { id: 'lei_es', name: 'Engenharia de Software', roleId: process.env.LEI_ES_ROLE_ID || '' },
              { id: 'lei_lc', name: 'Lógica e Computação', roleId: process.env.LEI_LC_ROLE_ID || '' },
              { id: 'lei_poo', name: 'Programação Orientada a Objetos', roleId: process.env.LEI_POO_ROLE_ID || '' },
              { id: 'lei_rc1', name: 'Redes de Computadores 1', roleId: process.env.LEI_RC1_ROLE_ID || '' },
              { id: 'lei_so', name: 'Sistemas Operativos', roleId: process.env.LEI_SO_ROLE_ID || '' }
            ]
          }
        ]
      },
      {
        id: '3',
        label: '3º Ano',
        roleId: process.env.LEI_YEAR_3_ROLE_ID || '', // ID do Cargo do 3º Ano de LEI (opcional)
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.LEI_YEAR_3_SEM_1_ROLE_ID || '', // ID do Cargo do 1º Semestre do 3º Ano (opcional)
            allKey: 'all_lei_3_s1',
            subjects: [
              { id: 'lei_ams', name: 'Análise e Modelação de Sistemas', roleId: process.env.LEI_AMS_ROLE_ID || '' },
              { id: 'lei_daw', name: 'Desenvolvimento de Aplicações para a Web', roleId: process.env.LEI_DAW_ROLE_ID || '' },
              { id: 'lei_ia', name: 'Inteligência Artificial', roleId: process.env.LEI_IA_ROLE_ID || '' },
              { id: 'lei_ipm', name: 'Interface Pessoa-Máquina', roleId: process.env.LEI_IPM_ROLE_ID || '' },
              { id: 'lei_rc2', name: 'Redes de Computadores 2', roleId: process.env.LEI_RC2_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.LEI_YEAR_3_SEM_2_ROLE_ID || '', // ID do Cargo do 2º Semestre do 3º Ano (opcional)
            allKey: 'all_lei_3_s2',
            subjects: [
              { id: 'lei_compi', name: 'Compiladores', roleId: process.env.LEI_COMPI_ROLE_ID || '' },
              { id: 'lei_cg', name: 'Computação Gráfica', roleId: process.env.LEI_CG_ROLE_ID || '' },
              { id: 'lei_grs', name: 'Gestão de Redes e Serviços', roleId: process.env.LEI_GRS_ROLE_ID || '' },
              { id: 'lei_les', name: 'Laboratório de Engenharia de Software', roleId: process.env.LEI_LES_ROLE_ID || '' },
              { id: 'lei_spd', name: 'Sistemas Paralelos e Distribuídos', roleId: process.env.LEI_SPD_ROLE_ID || '' },
              { id: 'lei_tc', name: 'Técnicas de Comunicação', roleId: process.env.LEI_TC_ROLE_ID || '' }
            ]
          }
        ]
      }
    ]
  },
  psc: {
    name: 'PSC - Pós Graduação em CiberSegurança',
    hasYearSelection: false,
    years: [
      {
        id: '1',
        label: '1º Ano',
        roleId: process.env.PSC_YEAR_1_ROLE_ID || '',
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.PSC_YEAR_1_SEM_1_ROLE_ID || '',
            allKey: 'all_psc_1_s1',
            subjects: [
              { id: 'psc_cm', name: 'Criptografia Moderna', roleId: process.env.PSC_CM_ROLE_ID || '' },
              { id: 'psc_iaev', name: 'Identificação, Análise e Exploração de Vulnerabilidades', roleId: process.env.PSC_IAEV_ROLE_ID || '' },
              { id: 'psc_sri', name: 'Segurança em Redes Informáticas, sem Fios e Móveis', roleId: process.env.PSC_SRI_ROLE_ID || '' },
              { id: 'psc_sem1', name: 'Seminário 1', roleId: process.env.PSC_SEM1_ROLE_ID || '' },
              { id: 'psc_sgia', name: 'Sistemas de Gestão e Identidades de Acesso', roleId: process.env.PSC_SGIA_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.PSC_YEAR_1_SEM_2_ROLE_ID || '',
            allKey: 'all_psc_1_s2',
            subjects: [
              { id: 'psc_afsc', name: 'Análise Forense de Sistemas Computacionais', roleId: process.env.PSC_AFSC_ROLE_ID || '' },
              { id: 'psc_actpa', name: 'Avaliação de CiberSegunrança, Testes de Penetração e Auditoria', roleId: process.env.PSC_ACTPA_ROLE_ID || '' },
              { id: 'psc_cgrcn', name: 'CiberGovernança, Gestão de Risco, Conformidade e Normas', roleId: process.env.PSC_CGRCN_ROLE_ID || '' },
              { id: 'psc_cas', name: 'CiberSegurança na Administração de Sistemas', roleId: process.env.PSC_CAS_ROLE_ID || '' },
              { id: 'psc_sem2', name: 'Seminário 2', roleId: process.env.PSC_SEM2_ROLE_ID || '' }
            ]
          }
        ]
      }
    ]
  },
  mei: {
    name: 'MEI - Mestrado em Engenharia Informática',
    hasYearSelection: true,
    years: [
      {
        id: '1',
        label: '1º Ano',
        roleId: process.env.MEI_YEAR_1_ROLE_ID || '',
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.MEI_YEAR_1_SEM_1_ROLE_ID || '',
            allKey: 'all_mei_1_s1',
            subjects: [
              { id: 'mei_aa', name: 'Aprendizagem Automática Avançada', roleId: process.env.MEI_AA_ROLE_ID || '' },
              { id: 'mei_as', name: 'Arquiteturas de Software', roleId: process.env.MEI_AS_ROLE_ID || '' },
              { id: 'mei_bigdata', name: 'Sistemas de Big Data', roleId: process.env.MEI_BIGDATA_ROLE_ID || '' },
              { id: 'mei_metodologia', name: 'Metodologia de Investigação', roleId: process.env.MEI_METODOLOGIA_ROLE_ID || '' },
              { id: 'mei_sec_avancada', name: 'Segurança Avançada de Sistemas', roleId: process.env.MEI_SEC_AVANCADA_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.MEI_YEAR_1_SEM_2_ROLE_ID || '',
            allKey: 'all_mei_1_s2',
            subjects: [
              { id: 'mei_otimizacao', name: 'Otimização e Pesquisa', roleId: process.env.MEI_OTIMIZACAO_ROLE_ID || '' },
              { id: 'mei_autonomos', name: 'Sistemas Autónomos e Robótica', roleId: process.env.MEI_AUTONOMOS_ROLE_ID || '' },
              { id: 'mei_cloud_native', name: 'Sistemas Cloud-Native', roleId: process.env.MEI_CLOUD_NATIVE_ROLE_ID || '' },
              { id: 'mei_dados_massivos', name: 'Processamento de Dados Massivos', roleId: process.env.MEI_DADOS_MASSIVOS_ROLE_ID || '' },
              { id: 'mei_seminario', name: 'Seminário de Engenharia Informática', roleId: process.env.MEI_SEMINARIO_ROLE_ID || '' }
            ]
          }
        ]
      },
      {
        id: '2',
        label: '2º Ano',
        roleId: process.env.MEI_YEAR_2_ROLE_ID || '',
        semesters: [
          {
            id: 's1',
            label: '1º Semestre',
            roleId: process.env.MEI_YEAR_2_SEM_1_ROLE_ID || '',
            allKey: 'all_mei_2_s1',
            subjects: [
              { id: 'mei_prep_dissertacao', name: 'Preparação para Dissertação', roleId: process.env.MEI_PREP_DISSERTACAO_ROLE_ID || '' },
              { id: 'mei_topicos1', name: 'Tópicos Avançados I', roleId: process.env.MEI_TOPICOS1_ROLE_ID || '' },
              { id: 'mei_topicos2', name: 'Tópicos Avançados II', roleId: process.env.MEI_TOPICOS2_ROLE_ID || '' },
              { id: 'mei_inovacao', name: 'Gestão de Inovação e Empreendedorismo', roleId: process.env.MEI_INOVACAO_ROLE_ID || '' },
              { id: 'mei_etica', name: 'Ética e Responsabilidade em IA', roleId: process.env.MEI_ETICA_ROLE_ID || '' }
            ]
          },
          {
            id: 's2',
            label: '2º Semestre',
            roleId: process.env.MEI_YEAR_2_SEM_2_ROLE_ID || '',
            allKey: 'all_mei_2_s2',
            subjects: [
              { id: 'mei_dissertacao', name: 'Dissertação de Mestrado', roleId: process.env.MEI_DISSERTACAO_ROLE_ID || '' },
              { id: 'mei_estagio_m', name: 'Estágio de Mestrado', roleId: process.env.MEI_ESTAGIO_M_ROLE_ID || '' },
              { id: 'mei_proj_empresa', name: 'Projeto em Empresa', roleId: process.env.MEI_PROJ_EMPRESA_ROLE_ID || '' },
              { id: 'mei_artigo', name: 'Publicação Científica e Comunicação', roleId: process.env.MEI_ARTIGO_ROLE_ID || '' },
              { id: 'mei_defesa', name: 'Defesa de Dissertação', roleId: process.env.MEI_DEFESA_ROLE_ID || '' }
            ]
          }
        ]
      }
    ]
  }
};

// Converte os códigos de curso nos respetivos nomes legíveis
export function getCourseName(code) {
  const names = {
    lei: 'LEI - Licenciatura em Engenharia Informática',
    psc: 'PSC - Pós Graduação em CiberSegurança',
    mei: 'MEI - Mestrado em Engenharia Informática',
    outro: 'Outro (não sou dos cursos do NEEI)'
  };
  return names[code] || code || 'Não selecionado';
}

// Retorna os dados de um curso
export function getCourseData(courseCode) {
  return COURSE_SUBJECTS[courseCode] || null;
}

// Retorna o nome de uma cadeira dado o seu ID
export function getSubjectName(subjectId) {
  for (const courseKey of Object.keys(COURSE_SUBJECTS)) {
    const course = COURSE_SUBJECTS[courseKey];
    for (const year of course.years) {
      for (const sem of year.semesters) {
        const found = sem.subjects.find(s => s.id === subjectId);
        if (found) return found.name;
      }
    }
  }
  return subjectId;
}

// Calcula e retorna a lista deduplicada de Role IDs (Curso, Anos, Semestres e Cadeiras) para um conjunto de cadeiras selecionadas
export function getRolesForSelectedSubjects(courseCode, selectedSubjectsSet) {
  const roleIds = new Set();
  const courseData = getCourseData(courseCode);
  if (!courseData || !selectedSubjectsSet || selectedSubjectsSet.size === 0) {
    return roleIds;
  }

  // Verifica se existe pelo menos 1 cadeira selecionada no curso
  let hasAnySelectedSubject = false;
  for (const year of courseData.years) {
    for (const sem of year.semesters) {
      if (sem.subjects.some(s => selectedSubjectsSet.has(s.id))) {
        hasAnySelectedSubject = true;
        break;
      }
    }
    if (hasAnySelectedSubject) break;
  }

  // Se existir pelo menos 1 cadeira selecionada do curso, adiciona o cargo do curso (se definido)
  if (hasAnySelectedSubject) {
    const envCourseRoleId = courseCode === 'lei' ? process.env.LEI_ROLE_ID
      : courseCode === 'psc' ? process.env.PSC_ROLE_ID
      : courseCode === 'mei' ? process.env.MEI_ROLE_ID
      : null;
    const courseRoleId = (courseData.roleId && courseData.roleId.trim()) || envCourseRoleId;
    if (courseRoleId && courseRoleId.trim()) {
      roleIds.add(courseRoleId.trim());
    }

    // Adiciona os cargos dos Anos, Semestres e Cadeiras selecionadas
    for (const year of courseData.years) {
      for (const sem of year.semesters) {
        const hasSelectedInSem = sem.subjects.some(s => selectedSubjectsSet.has(s.id));
        if (hasSelectedInSem) {
          if (year.roleId && year.roleId.trim()) roleIds.add(year.roleId.trim());
          if (sem.roleId && sem.roleId.trim()) roleIds.add(sem.roleId.trim());

          for (const subject of sem.subjects) {
            if (selectedSubjectsSet.has(subject.id) && subject.roleId && subject.roleId.trim()) {
              roleIds.add(subject.roleId.trim());
            }
          }
        }
      }
    }
  }

  return roleIds;
}
