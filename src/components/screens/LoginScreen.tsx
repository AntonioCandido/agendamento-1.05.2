

import React, { useState } from 'react';
import { obterAtendentePorUsuario } from '../../services/supabase';
import type { AppContextType } from '../../types';
import { Pagina, USUARIO_ADMIN, SENHA_ADMIN } from '../../constants';
import Spinner from '../common/Spinner';
import IconInput from '../common/IconInput';

const LoginScreen: React.FC<Omit<AppContextType, 'pagina' | 'usuario'>> = ({ setPagina, setUsuario }) => {
  const [usuario, setUsuarioState] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const efetuarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      if (usuario === USUARIO_ADMIN && senha === SENHA_ADMIN) {
        setUsuario({ id: 'admin', nome_real: 'Administrador' });
        setPagina(Pagina.Admin);
      } else {
        const atendente = await obterAtendentePorUsuario(usuario);
        if (atendente && atendente.senha === senha) {
          setUsuario(atendente);
          setPagina(Pagina.Atendente);
        } else {
          setErro('Usuário ou senha inválidos.');
        }
      }
    } catch (err) {
      setErro('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 space-y-6">
        <img 
          src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
          alt="Logo Estácio" 
          className="h-8 mx-auto mb-4"
        />
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800">Login</h2>
        {erro && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm font-semibold">{erro}</p>}
        <form onSubmit={efetuarLogin} className="space-y-6">
          <IconInput
            icone="bi-person"
            id="username"
            type="text"
            placeholder="Nome de Usuário"
            value={usuario}
            onChange={(e) => setUsuarioState(e.target.value)}
            required
            aria-label="Nome de Usuário"
          />
          <IconInput
            icone="bi-lock"
            id="password"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            aria-label="Senha"
          />
          <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-4 pt-2">
            <button
              type="submit"
              disabled={carregando}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-estacio-blue hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {carregando ? <Spinner /> : (
                <>
                  <i className="bi bi-box-arrow-in-right text-lg"></i>
                  <span>Entrar</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPagina(Pagina.Inicio)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
            >
              <i className="bi bi-x-circle text-lg"></i>
              <span>Voltar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;