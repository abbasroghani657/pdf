import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appPath = path.resolve(__dirname, '../src/App.jsx');

let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Remove ALL static data imports at the top
appCode = appCode.replace(/import \{ TOOLS_DATA.*? \} from '\.\/data\/tools.*?'\n/g, '');

// 2. Refactor the Routes block!
const routesStartStr = `<Routes>`;
const routesEndStr = `{/* ── ADMIN PANEL — Obscure path, admin-only ────────────────── */}`;

const startIndex = appCode.indexOf(routesStartStr);
const endIndex = appCode.indexOf(routesEndStr);

if (startIndex !== -1 && endIndex !== -1) {
  const dynamicRoutesCode = `<Routes>
            <Route path="/" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/tools" element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
            <Route path="/blog" element={<BlogList />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/mock-checkout" element={<MockCheckoutPage />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />
            <Route path="/invite-response" element={<InviteResponse />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/pdf-trends-2026" element={<PDFTrendsPage />} />
            
            {/* SEO Growth Hack Pages */}
            <Route path="/desktop" element={<DesktopAppPage />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/for/students" element={<Navigate to="/tools" replace />} />
            <Route path="/for/:industry" element={<UseCasePage />} />

            <Route path="/tools/:toolSlug" element={<ToolRenderer />} />
            <Route path="/tools/:toolSlug/:platform" element={<ToolRenderer />} />
            <Route path="/sign/:token" element={<SigningPage />} />

            {/* DYNAMIC TRANSLATED ROUTES FOR ALL 30 LANGUAGES */}
            {SUPPORTED_LANGS.filter(l => l !== 'en').map(lang => (
              <React.Fragment key={lang}>
                <Route path={\`/\${lang}\`} element={<HomePage searchQuery={searchQuery} setSearchQuery={setSearchQuery} lang={lang} />} />
                <Route path={\`/\${lang}/desktop\`} element={<DesktopAppPage lang={lang} />} />
                <Route path={\`/\${lang}/extension\`} element={<ExtensionPage lang={lang} />} />
                <Route path={\`/\${lang}/for/students\`} element={<Navigate to={\`/\${lang}/tools\`} replace />} />
                <Route path={\`/\${lang}/for/:industry\`} element={<UseCasePage lang={lang} />} />
                <Route path={\`/\${lang}/pricing\`} element={<PricingPage lang={lang} />} />
                <Route path={\`/\${lang}/compare\`} element={<ComparePage lang={lang} />} />
                <Route path={\`/\${lang}/about\`} element={<AboutPage lang={lang} />} />
                <Route path={\`/\${lang}/contact\`} element={<ContactPage lang={lang} />} />
                <Route path={\`/\${lang}/privacy\`} element={<PrivacyPage lang={lang} />} />
                <Route path={\`/\${lang}/terms\`} element={<TermsPage lang={lang} />} />
                <Route path={\`/\${lang}/blog\`} element={<BlogList lang={lang} />} />
                <Route path={\`/\${lang}/blog/:slug\`} element={<BlogPost lang={lang} />} />
                <Route path={\`/\${lang}/pdf-trends-2026\`} element={<PDFTrendsPage lang={lang} />} />
                <Route path={\`/\${lang}/login\`} element={<LoginPage lang={lang} />} />
                <Route path={\`/\${lang}/register\`} element={<RegisterPage lang={lang} />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path={\`/\${lang}/dashboard\`} element={<DashboardPage lang={lang} />} />
                </Route>
                
                <Route path={\`/\${lang}/forgot-password\`} element={<ForgotPasswordPage lang={lang} />} />
                <Route path={\`/\${lang}/reset-password\`} element={<ResetPasswordPage lang={lang} />} />
                <Route path={\`/\${lang}/auth/callback\`} element={<OAuthCallbackPage lang={lang} />} />
                <Route path={\`/\${lang}/payment-success\`} element={<PaymentSuccessPage lang={lang} />} />
                
                <Route path={\`/\${lang}/tools/:toolSlug\`} element={<ToolRenderer lang={lang} />} />
                <Route path={\`/\${lang}/tools/:toolSlug/:platform\`} element={<ToolRenderer lang={lang} />} />
                <Route path={\`/\${lang}/sign/:token\`} element={<SigningPage lang={lang} />} />
              </React.Fragment>
            ))}

            `;
  
  appCode = appCode.substring(0, startIndex) + dynamicRoutesCode + appCode.substring(endIndex);
} else {
  console.log("Could not find routes block");
}

fs.writeFileSync(appPath, appCode);
console.log('App.jsx refactored with dynamic routes and static data imports removed!');
