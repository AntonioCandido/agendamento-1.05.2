import React, { useState, useEffect } from 'react';
import { Pagina } from './constants';
import type { Usuario } from './types';
import { testarConexaoBancoDados, ConnectionStatus } from './services/supabase';
import Spinner from './components/common/Spinner';

import HomeScreen from './components/screens/HomeScreen';
import LoginScreen from './components/screens/LoginScreen';
import AdminScreen from './components/screens/AdminScreen';
import AttendantScreen from './components/screens/AttendantScreen';
import StudentScreen from './components/screens/StudentScreen';
import DbErrorScreen from './components/screens/DbErrorScreen';

const App: React.FC = () => {
  const [pagina, setPagina] = useState<Pagina>(Pagina.Inicio);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificandoConexao, setVerificandoConexao] = useState(true);
  const [connectionError, setConnectionError] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    const verificarConexao = async () => {
      const conexao = await testarConexaoBancoDados();
      if (!conexao.success) {
        setConnectionError(conexao);
        setPagina(Pagina.ErroBD);
      }
      setVerificandoConexao(false);
    };

    verificarConexao();
  }, []);

  const renderizarPagina = () => {
    switch (pagina) {
      case Pagina.Inicio:
        return <HomeScreen setPagina={setPagina} />;
      case Pagina.Login:
        return <LoginScreen setPagina={setPagina} setUsuario={setUsuario} />;
      case Pagina.Admin:
        if (usuario?.id === 'admin') {
          return <AdminScreen setPagina={setPagina} usuario={usuario} setUsuario={setUsuario} />;
        }
        return <LoginScreen setPagina={setPagina} setUsuario={setUsuario} />;
      case Pagina.Atendente:
        if (usuario && usuario.id !== 'admin') {
          return <AttendantScreen setPagina={setPagina} usuario={usuario} setUsuario={setUsuario} />;
        }
        return <LoginScreen setPagina={setPagina} setUsuario={setUsuario} />;
      case Pagina.Candidato:
        return <StudentScreen setPagina={setPagina} />;
      case Pagina.ErroBD:
        return <DbErrorScreen setPagina={setPagina} connectionError={connectionError} />;
      default:
        return <HomeScreen setPagina={setPagina} />;
    }
  };
  
  if (verificandoConexao) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 font-sans justify-center items-center">
        <Spinner />
        <p className="mt-4 text-gray-600">Verificando conexão com o banco de dados...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      {renderizarPagina()}
    </div>
  );
};

export default App;
