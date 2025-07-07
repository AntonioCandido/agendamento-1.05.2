

import React from 'react';
import type { AppContextType } from '../../types';
import { Pagina } from '../../constants';

const HomeScreen: React.FC<Omit<AppContextType, 'pagina' | 'usuario' | 'setUsuario'>> = ({ setPagina }) => {

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
            <img 
              src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
              alt="Logo Estácio" 
              className="h-9"
            />
            <img 
              src="https://acessounico.mec.gov.br/logo_prouni.61b3a00c.svg" 
              alt="Logo Prouni" 
              className="h-12"
            />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
          AGENDAMENTO
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Card Candidato */}
            <div
                onClick={() => setPagina(Pagina.Candidato)}
                className="group bg-slate-50 rounded-xl shadow-lg p-6 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
                <div className="mx-auto w-20 h-20 flex items-center justify-center bg-blue-100 rounded-full mb-4 transition-colors duration-300 group-hover:bg-blue-200">
                    <i className="bi bi-calendar-check text-4xl text-estacio-blue"></i>
                </div>
                <h2 className="font-bold text-xl text-gray-800 mb-1">Sou Candidato</h2>
                <p className="text-sm text-gray-500">Clique aqui para agendar seu atendimento presencial.</p>
            </div>

            {/* Card Prouni */}
            <a
                href="https://estacio.br/estude-na-estacio/bolsas-e-financiamentos/tudo-sobre-prouni?srsltid=AfmBOoqD5ud3nTi1Agz7ziVBj6lFzEDOuMPtP5DQuVtJj3wu_vcBtXdV"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-slate-50 rounded-xl shadow-lg p-6 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
                <div className="mx-auto w-20 h-20 flex items-center justify-center bg-red-100 rounded-full mb-4 transition-colors duration-300 group-hover:bg-red-200">
                    <i className="bi bi-info-circle text-4xl text-estacio-red"></i>
                </div>
                <h2 className="font-bold text-xl text-gray-800 mb-1">Tudo sobre o Prouni</h2>
                <p className="text-sm text-gray-500">Saiba mais sobre o programa e tire suas dúvidas.</p>
            </a>
        </div>
        
        <div className="text-center pt-4 border-t border-gray-200">
          <button
            onClick={() => setPagina(Pagina.Login)}
            className="inline-flex items-center gap-2 text-estacio-blue font-semibold hover:underline"
          >
            <i className="bi bi-person-workspace"></i>
            Sou Atendente - Versão:1.05.2
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;