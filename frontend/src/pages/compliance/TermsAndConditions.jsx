import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Card, Button } from '../../components';
import { useTranslation } from '../../i18n/useTranslation';

export const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate(-1)} />
      <section className="bg-primary py-8 px-4 text-center">
        <h1 className="text-3xl font-bold text-text-dark">{t('compliance.termsAndConditions')}</h1>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-8">
        <Card className="prose max-w-none text-text-dark">
          {locale === 'kn' ? (
            <div className="space-y-6 text-sm leading-relaxed">
              <p className="font-bold">ಕೊನೆಯದಾಗಿ ನವೀಕರಿಸಿದ್ದು: ಜೂನ್ 7, 2026</p>
              
              <div>
                <h3 className="text-lg font-bold mb-2">೧. ನಿಯಮಗಳ ಅಂಗೀಕಾರ</h3>
                <p>MilkMaatu ಬಳಸುವ ಮೂಲಕ, ನೀವು ಈ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳಿಗೆ ಬದ್ಧರಾಗಿರಲು ಒಪ್ಪುತ್ತೀರಿ. ನೀವು ಇವುಗಳನ್ನು ಒಪ್ಪದಿದ್ದರೆ, ದಯವಿಟ್ಟು ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಬೇಡಿ.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">೨. ಸಂತೆ ಮಾರುಕಟ್ಟೆ ನಿಯಮಗಳು</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>ದನಗಳ ಮಾರಾಟದ ಜಾಹೀರಾತು ಸಲ್ಲಿಸುವಾಗ ಕೇವಲ ಲೈವ್ ಕ್ಯಾಮರಾದಿಂದ ತೆಗೆದ ಫೋಟೋವನ್ನು ಮಾತ್ರ ಬಳಸಬೇಕು. ಗ್ಯಾಲರಿ ಚಿತ್ರಗಳನ್ನು ಅನುಮತಿಸುವುದಿಲ್ಲ.</li>
                  <li>ಜಾಹೀರಾತುಗಳು ಪ್ರಕಟಗೊಂಡ ೨೪ ಗಂಟೆಗಳ ನಂತರ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಅಳಿಸಿಹೋಗುತ್ತವೆ.</li>
                  <li>ವರದಿಯಾದ ಅಥವಾ ವಂಚನೆಯ ಮಾಹಿತಿ ಇರುವ ಜಾಹೀರಾತುಗಳನ್ನು ತಕ್ಷಣವೇ ಯಾವುದೇ ಮುನ್ಸೂಚನೆ ಇಲ್ಲದೆ ತೆಗೆದುಹಾಕುವ ಹಕ್ಕನ್ನು ಆಡಳಿತ ಮಂಡಳಿ ಹೊಂದಿದೆ.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">೩. ಬಳಕೆದಾರರ ಹೊಣೆಗಾರಿಕೆ</h3>
                <p>ಬಳಕೆದಾರರು ನೀಡುವ ಮಾಹಿತಿ ನೈಜವಾಗಿರಬೇಕು. ಯಾವುದೇ ಸುಳ್ಳು ಮಾಹಿತಿ ಅಥವಾ ವಂಚನೆಯ ಚಟುವಟಿಕೆ ಕಂಡುಬಂದಲ್ಲಿ ಬಳಕೆದಾರರ ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಮಾನತು ಮಾಡಲಾಗುವುದು.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">೪. ಮಾಹಿತಿ ನಿಯಂತ್ರಣ ಮತ್ತು ಮಾಡರೇಷನ್</h3>
                <p>ಯಾರಾದರೂ ವಂಚನೆ ಅಥವಾ ಆಕ್ಷೇಪಾರ್ಹ ದನದ ಜಾಹೀರಾತುಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿದರೆ "ಜಾಹೀರಾತು ವರದಿ ಮಾಡಿ" ಬಟನ್ ಬಳಸಿ ವರದಿ ಮಾಡಬಹುದು. ನಮ್ಮ ಅಡ್ಮಿನ್ ತಂಡವು ವರದಿಗಳನ್ನು ೨೪ ಗಂಟೆಗಳಲ್ಲಿ ಪರಿಶೀಲಿಸಿ ಸೂಕ್ತ ಕ್ರಮ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">೫. ಹೊಣೆಗಾರಿಕೆಯ ಹಕ್ಕುತ್ಯಾಗ (Disclaimer of Liability)</h3>
                <p>ದನಗಳ ಮಾರಾಟ ಅಥವಾ ಆರೋಗ್ಯ ಮಾಹಿತಿ ಒಪ್ಪಂದಗಳು ಕೇವಲ ಖರೀದಿದಾರರು ಮತ್ತು ಮಾರಾಟಗಾರರ ನಡುವಿನ ವೈಯಕ್ತಿಕ ಒಪ್ಪಂದಗಳಾಗಿವೆ. MilkMaatu ಕೇವಲ ಸಂಪರ್ಕ ಕಲ್ಪಿಸುವ ವೇದಿಕೆಯಾಗಿದ್ದು, ಯಾವುದೇ ಆರ್ಥಿಕ ಅಥವಾ ದನಗಳ ಆರೋಗ್ಯದ ನಷ್ಟಕ್ಕೆ ಜವಾಬ್ದಾರರಾಗಿರುವುದಿಲ್ಲ.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-sm leading-relaxed">
              <p className="font-bold">Last Updated: June 7, 2026</p>
              
              <div>
                <h3 className="text-lg font-bold mb-2">1. Acceptance of Terms</h3>
                <p>By registering or using the MilkMaatu mobile web application, you consent to comply with our Terms & Conditions. If you disagree, you must cease usage.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">2. Sante Marketplace Rules</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Cattle listings must utilize live camera uploads only. Simulated or gallery media is blocked for listing integrity.</li>
                  <li>All active listings automatically expire and self-delete from the database after 24 hours.</li>
                  <li>Sellers are solely responsible for setting honest descriptions, ages, yields, and prices.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">3. Content Moderation & Reporting</h3>
                <p>We operate a zero-tolerance policy for offensive, fake, or fraudulent listings. Users are encouraged to click "Report Listing" to instantly flag suspicious posts. Admin reviews reports daily and suspends violating accounts.</p>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-2">4. Disclaimers of Liability</h3>
                <p>MilkMaatu acts as a digital matching marketplace. We are not liable for negotiations, transactions, transport safety, livestock health disputes, or monetary losses arising between buyer and seller.</p>
              </div>
            </div>
          )}
          <div className="mt-8 text-center">
            <Button variant="primary" onClick={() => navigate(-1)} className="px-8 font-bold">
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
};
