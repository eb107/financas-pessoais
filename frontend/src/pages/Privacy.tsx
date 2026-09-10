import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GlowBackground } from "../components/GlowBackground";

export function Privacy() {
  return (
    <div className="relative flex min-h-screen justify-center px-4 py-12">
      <GlowBackground />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-strong w-full max-w-2xl rounded-2xl p-8 shadow-2xl"
      >
        <h1 className="font-display mb-1 text-3xl font-bold">
          Aviso de Privacidade
        </h1>
        <p className="mb-8 text-sm text-white/50">
          Como o Finanças Pessoais trata dado pessoal, em conformidade com a
          LGPD (Lei nº 13.709/2018).
        </p>

        <section className="mb-6">
          <h2 className="font-display mb-2 text-lg font-semibold text-accent-cyan">
            Quem trata os dados
          </h2>
          <p className="text-sm leading-relaxed text-white/70">
            Projeto de portfólio pessoal, sem CNPJ ou operação comercial por
            trás. Não há Encarregado de Dados (DPO) formalmente designado — o
            próprio desenvolvedor é o ponto de contato para qualquer dúvida
            sobre dados pessoais.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-display mb-2 text-lg font-semibold text-accent-cyan">
            Quais dados são coletados
          </h2>
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-white/70">
            <li>Username, e-mail e senha (com hash) — identificação e autenticação.</li>
            <li>
              Carteiras, categorias, tags, transações e orçamentos — é a
              própria finalidade do serviço.
            </li>
            <li>Mensagens de chat com o assistente de IA.</li>
            <li>
              Data/hora do primeiro uso de alguma funcionalidade de IA
              (registro de consentimento).
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Nenhum dado sensível pela definição da LGPD (origem racial,
            convicção religiosa, saúde, dado biométrico, etc.) é coletado.
            Dado financeiro é dado pessoal comum, não dado sensível.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-display mb-2 text-lg font-semibold text-accent-cyan">
            IA e compartilhamento com terceiros
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-white/70">
            Três funcionalidades enviam dado pessoal pra API da Anthropic
            (Claude), empresa americana — uma transferência internacional de
            dados:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-white/70">
            <li>
              <strong className="text-white/90">Categorização automática:</strong>{" "}
              a descrição da transação, só quando nenhuma regra local
              reconhece o texto.
            </li>
            <li>
              <strong className="text-white/90">Chat assistente:</strong> um
              resumo financeiro agregado — nunca o histórico bruto de
              transações.
            </li>
            <li>
              <strong className="text-white/90">Insights automáticos:</strong>{" "}
              os padrões já detectados localmente, narrados em texto natural.
            </li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            A previsão de gastos <strong>não</strong> usa IA — é regressão
            linear local, nenhum dado sai do servidor. Nenhuma das três
            chamadas acontece antes de você usar alguma funcionalidade de IA
            explicitamente pelo menos uma vez, e você pode revogar esse
            consentimento a qualquer momento em{" "}
            <Link to="/settings" className="text-accent-cyan hover:underline">
              Configurações
            </Link>
            .
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-display mb-2 text-lg font-semibold text-accent-cyan">
            Retenção e segurança
          </h2>
          <p className="text-sm leading-relaxed text-white/70">
            Insights e tokens de autenticação expirados são removidos
            automaticamente após um tempo. Senhas nunca ficam em texto
            plano, cada usuário só acessa os próprios dados, e a exportação
            ou exclusão da conta ficam registradas num log de auditoria
            interno.
          </p>
        </section>

        <section className="mb-2">
          <h2 className="font-display mb-2 text-lg font-semibold text-accent-cyan">
            Seus direitos
          </h2>
          <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-white/70">
            <li>Confirmar quais dados existem, em Configurações.</li>
            <li>Exportar todos os seus dados a qualquer momento.</li>
            <li>Corrigir dados incorretos diretamente pela interface.</li>
            <li>Excluir a conta e todos os dados associados, de forma definitiva.</li>
          </ul>
        </section>

        <Link
          to="/login"
          className="mt-6 inline-block text-sm text-accent-cyan hover:underline"
        >
          ← Voltar
        </Link>
      </motion.div>
    </div>
  );
}
