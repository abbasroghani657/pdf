import { TOOLS_DATA } from '../data/tools';
import { TOOLS_DATA_ES } from '../data/tools-es';
import { slugify } from '../utils/slugify';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function ComparePage({ lang = 'en' }) {
  const { isPro } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="mt-4">
      <div className="max-w-4xl mx-auto">
        {/* Comparison table */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold text-gray-500 w-[40%]">
                    {lang === 'es' ? 'Característica' : lang === 'fr' ? 'Caractéristique' : lang === 'de' ? 'Funktion' : lang === 'pt' ? 'Recurso' : 'Feature'}
                  </th>
                  <th className="py-3 px-2 sm:py-4 sm:px-6 w-[30%] border-l border-gray-100 bg-blue-50/30 text-center sm:text-left">
                    <div className="scale-[0.8] sm:scale-100 origin-left sm:origin-left inline-block">
                      <Logo size="sm" />
                    </div>
                  </th>
                  <th className="py-3 px-3 sm:py-4 sm:px-6 text-[11px] sm:text-sm font-semibold text-gray-400 w-[30%] border-l border-gray-100 leading-tight">
                    {lang === 'es' ? 'Otras Plataformas' : lang === 'fr' ? 'Autres Plateformes' : lang === 'de' ? 'Andere Plattformen' : lang === 'pt' ? 'Outras Plataformas' : 'Other Platforms'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { feature: lang === 'es' ? 'Límite tamaño' : lang === 'fr' ? 'Limite de taille' : lang === 'de' ? 'Dateigrößenlimit' : lang === 'pt' ? 'Limite tamanho' : 'Free size limit', us: '10 MB', them: '5 MB', winner: false },
                  { feature: lang === 'es' ? 'Herramientas IA' : lang === 'fr' ? 'Outils IA' : lang === 'de' ? 'KI-Tools' : lang === 'pt' ? 'Ferramentas IA' : 'AI tools', us: lang === 'es' ? '✓ Sí' : lang === 'fr' ? '✓ Oui' : lang === 'de' ? '✓ Ja' : lang === 'pt' ? '✓ Sim' : '✓ Yes', them: lang === 'es' ? '✗ No' : lang === 'fr' ? '✗ Non' : lang === 'de' ? '✗ Nein' : lang === 'pt' ? '✗ Não' : '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                  { feature: lang === 'es' ? 'Precio Pro' : lang === 'fr' ? 'Prix Pro' : lang === 'de' ? 'Pro-Preis' : lang === 'pt' ? 'Preço Pro' : 'Pro price', us: '$4.99/mo', them: '$9.99/mo', winner: true },
                  { feature: lang === 'es' ? 'Total herramientas' : lang === 'fr' ? 'Total outils' : lang === 'de' ? 'Tools' : lang === 'pt' ? 'Total ferramentas' : 'Total tools', us: '37+', them: '25', winner: true },
                  { feature: lang === 'es' ? 'Sin registro' : lang === 'fr' ? 'Sans inscription' : lang === 'de' ? 'Ohne Anmeldung' : lang === 'pt' ? 'Sem registro' : 'No signup', us: lang === 'es' ? '✓ Sí' : lang === 'fr' ? '✓ Oui' : lang === 'de' ? '✓ Ja' : lang === 'pt' ? '✓ Sim' : '✓ Yes', them: lang === 'es' ? '✗ No' : lang === 'fr' ? '✗ Non' : lang === 'de' ? '✗ Nein' : lang === 'pt' ? '✗ Não' : '✗ No', winner: true, usClass: 'text-emerald-600', themClass: 'text-red-400' },
                  { feature: lang === 'es' ? 'Velocidad' : lang === 'fr' ? 'Vitesse' : lang === 'de' ? 'Geschwindigkeit' : lang === 'pt' ? 'Velocidade' : 'Speed', us: lang === 'es' ? 'Rápida' : lang === 'fr' ? 'Rapide' : lang === 'de' ? 'Schnell' : lang === 'pt' ? 'Rápida' : 'Fast', them: lang === 'es' ? 'Estándar' : lang === 'fr' ? 'Standard' : lang === 'de' ? 'Standard' : lang === 'pt' ? 'Padrão' : 'Standard', winner: true },
                  { feature: lang === 'es' ? 'API gratis' : lang === 'fr' ? 'API gratuite' : lang === 'de' ? 'API kostenlos' : lang === 'pt' ? 'API grátis' : 'Free API', us: lang === 'es' ? '✗ Pro' : lang === 'fr' ? '✗ Pro' : lang === 'de' ? '✗ Pro' : lang === 'pt' ? '✗ Pro' : '✗ Pro', them: lang === 'es' ? '✗ Pro' : lang === 'fr' ? '✗ Pro' : lang === 'de' ? '✗ Pro' : lang === 'pt' ? '✗ Pro' : '✗ Pro', winner: false },
                  { feature: lang === 'es' ? 'Proceso lotes' : lang === 'fr' ? 'Traitement lots' : lang === 'de' ? 'Stapelverarbeitung' : lang === 'pt' ? 'Processo lote' : 'Batch process', us: lang === 'es' ? '✓ Sí' : lang === 'fr' ? '✓ Oui' : lang === 'de' ? '✓ Ja' : lang === 'pt' ? '✓ Sim' : '✓ Yes', them: lang === 'es' ? '✓ Sí' : lang === 'fr' ? '✓ Oui' : lang === 'de' ? '✓ Ja' : lang === 'pt' ? '✓ Sim' : '✓ Yes', winner: false, usClass: 'text-emerald-600', themClass: 'text-emerald-500' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/40">
                    <td className="py-3 px-3 sm:py-4 sm:px-6 text-[11px] sm:text-sm text-gray-700 font-medium leading-tight">{row.feature}</td>
                    <td className={clsx('py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-bold border-l border-gray-100 bg-blue-50/20', row.usClass || 'text-gray-900')}>
                      {row.us}
                    </td>
                    <td className={clsx('py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold border-l border-gray-100', row.themClass || 'text-gray-400')}>
                      {row.them}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why us cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {[
            { icon: 'solar:stars-bold', color: 'bg-fuchsia-50 text-fuchsia-600', 
              title: lang === 'es' ? 'Herramientas con IA — gratis' : lang === 'fr' ? 'Outils IA — gratuits' : lang === 'de' ? 'KI-Tools — kostenlos' : lang === 'pt' ? 'Ferramentas com IA — grátis' : 'AI-powered tools — free', 
              desc: lang === 'es' ? 'Chatea con PDFs, auto-resume y traduce. Funciones que la competencia no tiene.' : lang === 'fr' ? 'Discutez avec vos PDFs, résumez et traduisez. Des fonctionnalités exclusives.' : lang === 'de' ? 'Mit PDFs chatten, zusammenfassen und übersetzen. Exklusive Funktionen.' : lang === 'pt' ? 'Converse com PDFs, auto-resuma e traduza. Recursos que a concorrência não tem.' : 'Chat with PDFs, auto-summarize, and translate documents. Features most competitors simply don\'t have.' },
            { icon: 'solar:box-minimalistic-bold', color: 'bg-blue-50 text-blue-600', 
              title: lang === 'es' ? 'Nivel gratuito mayor' : lang === 'fr' ? 'Niveau gratuit plus large' : lang === 'de' ? 'Größere kostenlose Stufe' : lang === 'pt' ? 'Nível gratuito maior' : 'Bigger free tier', 
              desc: lang === 'es' ? `Procesa archivos de hasta ${isPro ? '2GB' : '10MB'} gratis.` : lang === 'fr' ? `Traitez des fichiers jusqu'à ${isPro ? '2Go' : '10Mo'} gratuitement.` : lang === 'de' ? `Verarbeiten Sie Dateien bis zu ${isPro ? '2GB' : '10MB'} kostenlos.` : lang === 'pt' ? `Processe arquivos de até ${isPro ? '2GB' : '10MB'} de graça.` : `Process files up to ${isPro ? '2GB' : '10MB'} without paying. Stop hitting paywalls for everyday tasks.` },
            { icon: 'solar:wallet-bold', color: 'bg-amber-50 text-amber-600', 
              title: lang === 'es' ? 'Mejor valor' : lang === 'fr' ? 'Meilleure valeur' : lang === 'de' ? 'Besseres Preis-Leistungs-Verhältnis' : lang === 'pt' ? 'Melhor valor' : 'Better value', 
              desc: lang === 'es' ? 'Pro a $4.99/mes vs $9.99+. Mejor calidad, mitad de precio.' : lang === 'fr' ? 'Pro à 4,99$/mois vs 9,99$+. Meilleure qualité, moitié prix.' : lang === 'de' ? 'Pro für 4,99 $/Monat statt 9,99 $+. Bessere Qualität, halber Preis.' : lang === 'pt' ? 'Pro a $4.99/mês vs $9.99+. Melhor qualidade, metade do preço.' : 'Pro at $4.99/mo vs competitors\' $9.99+. Better quality, half the cost.' },
            { icon: 'solar:layers-bold', color: 'bg-emerald-50 text-emerald-600', 
              title: lang === 'es' ? 'Más herramientas' : lang === 'fr' ? 'Plus d\'outils' : lang === 'de' ? 'Mehr Tools' : lang === 'pt' ? 'Mais ferramentas' : 'More tools', 
              desc: lang === 'es' ? 'La suite PDF más completa. Si necesitas una herramienta, la tenemos.' : lang === 'fr' ? 'La suite PDF la plus complète. Si vous avez besoin d\'un outil, nous l\'avons.' : lang === 'de' ? 'Die umfassendste PDF-Suite. Wenn Sie ein Tool brauchen, haben wir es.' : lang === 'pt' ? 'A suíte PDF mais completa. Se você precisa de uma ferramenta, nós a temos.' : 'The most comprehensive PDF suite available. If you need a PDF tool, we have it.' },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center mb-4', card.color)}>
                <iconify-icon icon={card.icon} class="text-xl"></iconify-icon>
              </div>
              <h4 className="text-base font-semibold text-gray-900 mb-2">{card.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-[#1e3a5f] to-[#378ADD] rounded-3xl p-10 text-white">
          <h3 className="text-xl font-bold mb-2">
            {lang === 'es' ? '¿Listo para cambiar?' : lang === 'fr' ? 'Prêt à changer ?' : lang === 'de' ? 'Bereit zu wechseln?' : lang === 'pt' ? 'Pronto para mudar?' : 'Ready to switch?'}
          </h3>
          <p className="text-blue-100 text-sm mb-6">
            {lang === 'es' ? 'Únete a los profesionales que eligieron el kit de PDF más inteligente.' : lang === 'fr' ? 'Rejoignez les professionnels qui ont choisi la boîte à outils PDF plus intelligente.' : lang === 'de' ? 'Schließen Sie sich Profis an, die sich für das intelligentere PDF-Toolkit entschieden haben.' : lang === 'pt' ? 'Junte-se a profissionais que escolheram o kit de ferramentas PDF mais inteligente.' : 'Join professionals who chose the smarter PDF toolkit.'}
          </p>
          <button
            onClick={() => { navigate('/'); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#378ADD] rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all shadow-lg hover:-translate-y-0.5"
          >
            {lang === 'es' ? 'Prueba TheyLovePDF gratis' : lang === 'fr' ? 'Essayez TheyLovePDF gratuitement' : lang === 'de' ? 'Testen Sie TheyLovePDF kostenlos' : lang === 'pt' ? 'Experimente o TheyLovePDF grátis' : 'Try TheyLovePDF for free'}
            <iconify-icon icon="solar:arrow-right-linear" class="text-lg"></iconify-icon>
          </button>
        </div>
      </div>
    </div>
  );
}
