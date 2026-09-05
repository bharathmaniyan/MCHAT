/**
 * AI Museum Guide Service
 * Provides grounded, contextual, multilingual responses for museum visitors.
 */

export const askMuseumAi = async ({ question, museum, shows = [], lang = 'en' }) => {
  // Simulate minimal AI network delay for natural feel
  await new Promise(r => setTimeout(r, 650));

  const q = (question || '').toLowerCase().trim();
  const mName = museum?.museumName || 'our museum';
  const adultP = museum?.adultPrice || museum?.adultTicketPrice || 30;
  const childP = museum?.childPrice || museum?.childTicketPrice || 15;
  const location = museum?.location || museum?.city || 'the city center';
  const opening = museum?.openingTime || '09:00';
  const closing = museum?.closingTime || '17:00';

  // 1. EXHIBITS / WHAT TO SEE
  if (
    q.includes('exhibit') || q.includes('see') || q.includes('collection') ||
    q.includes('கண்காட்சி') || q.includes('பார்க்க') || q.includes('காண') ||
    q.includes('प्रदर्शन') || q.includes('देखने') || q.includes('चीजें') ||
    q.includes('ver') || q.includes('exposicion') || q.includes('voir')
  ) {
    const responses = {
      en: `🏛️ At **${mName}** in ${location}, you can explore world-class galleries, historical artifacts, interactive educational displays, and vintage machinery.\n\n` +
          `• **Featured Exhibits**: Rare historical items, curated thematic galleries, and multimedia walk-throughs.\n` +
          `• **Special Shows**: We regularly host science & cultural shows.` +
          (shows.length > 0 ? ` Right now, we have **${shows.length}** special show(s) scheduled!` : ''),
      ta: `🏛️ **${mName}** அருங்காட்சியகத்தில் (${location}) நீங்கள் வரலாற்றுச் சின்னங்கள், அரிய கலைப்பொருட்கள் மற்றும் ஊடாடும் கல்வி காட்சிகளை கண்டு களிக்கலாம்.\n\n` +
          `• **முக்கிய அம்சங்கள்**: அரிய வரலாற்று தொகுப்புகள், பாரம்பரிய கலைப்பொருட்கள் மற்றும் தொழில்நுட்ப காட்சிகள்.\n` +
          (shows.length > 0 ? `• **சிறப்பு நிகழ்ச்சிகள்**: தற்போது **${shows.length}** சிறப்பு நிகழ்ச்சிகள் உள்ளன!` : ''),
      hi: `🏛️ **${mName}** (${location}) में आप प्राचीन ऐतिहासिक वस्तुएं, अनोखी गैलरी और शिक्षाप्रद प्रदर्शनियों का आनंद ले सकते हैं।\n\n` +
          `• **मुख्य आकर्षण**: ऐतिहासिक संग्रह, विशेष दीर्घाएं और मल्टीमीडिया वॉकथ्रू।\n` +
          (shows.length > 0 ? `• **विशेष शो**: वर्तमान में **${shows.length}** विशेष शो निर्धारित हैं!` : ''),
      es: `🏛️ En **${mName}** en ${location}, puede explorar galerías históricas, piezas patrimoniales y exhibiciones interactivas.\n\n` +
          `• **Colecciones Destacadas**: Objetos de gran valor histórico y exposiciones temáticas guiadas.`,
      fr: `🏛️ Au **${mName}** à ${location}, découvrez des galeries historiques fascinantes, des objets rares et des expositions interactives.`
    };

    return {
      text: responses[lang] || responses.en,
      action: 'VIEW_SHOWS'
    };
  }

  // 2. PARKING & TRANSPORT
  if (
    q.includes('park') || q.includes('car') || q.includes('vehicle') || q.includes('reach') ||
    q.includes('பார்க்கிங்') || q.includes('வாகன') || q.includes('வண்டி') ||
    q.includes('पार्किंग') || q.includes('गाड़ी') || q.includes('वाहन') ||
    q.includes('estacionamiento') || q.includes('aparcamiento')
  ) {
    const responses = {
      en: `🚗 **Parking Information for ${mName}**:\n\n` +
          `• **Dedicated Parking**: On-site parking is available for both two-wheelers and four-wheelers during museum hours.\n` +
          `• **Accessibility**: Priority parking spaces are reserved near the main gate for senior citizens and differently-abled visitors.\n` +
          `• **Location**: ${museum?.address || location}.`,
      ta: `🚗 **${mName} வாகன நிறுத்துமிட வசதி**:\n\n` +
          `• அருங்காட்சியக வளாகத்திலேயே இருசக்கர மற்றும் நான்கு சக்கர வாகனங்களுக்கான போதுமான பாதுகாப்புடன் கூடிய பார்க்கிங் வசதி உள்ளது.\n` +
          `• முதியவர்கள் மற்றும் மாற்றுத்திறனாளிகளுக்காக நுழைவாயில் அருகே சிறப்பு பார்க்கிங் வசதி உண்டு.\n` +
          `• முகவரி: ${museum?.address || location}.`,
      hi: `🚗 **${mName} में पार्किंग सुविधा**:\n\n` +
          `• संग्रहालय परिसर में दोपहिया और चार पहिया वाहनों के लिए सुरक्षित पार्किंग उपलब्ध है।\n` +
          `• वरिष्ठ नागरिकों और दिव्यांगों के लिए मुख्य द्वार के निकट विशेष आरक्षित पार्किंग है।\n` +
          `• पता: ${museum?.address || location}.`,
      es: `🚗 **Estacionamiento en ${mName}**:\n\n` +
          `• Disponemos de estacionamiento seguro para automóviles y motocicletas durante el horario del museo.\n` +
          `• Plazas accesibles reservadas cerca de la entrada principal.`,
      fr: `🚗 **Stationnement au ${mName}**:\n\n` +
          `• Un parking sécurisé pour voitures et deux-roues est disponible sur place.\n` +
          `• Places prioritaires près de l'entrée principale.`
    };

    return { text: responses[lang] || responses.en };
  }

  // 3. PRICING / FAMILY COST CALCULATION
  if (
    q.includes('price') || q.includes('cost') || q.includes('ticket') || q.includes('rate') || q.includes('fee') ||
    q.includes('family') || q.includes('கட்டணம்') || q.includes('விலை') || q.includes('டிக்கெட்') ||
    q.includes('குடும்ப') || q.includes('किराया') || q.includes('दर') || q.includes('फीस') ||
    q.includes('precio') || q.includes('tarif')
  ) {
    const familyCost = (2 * adultP) + (1 * childP);
    const responses = {
      en: `💰 **Ticket Rates at ${mName}**:\n\n` +
          `• 👨 **Adults**: ₹${adultP} per person\n` +
          `• 👦 **Children**: ₹${childP} per child (under 12)\n` +
          `• 👨‍👩‍👧 **Example Family (2 Adults + 1 Child)**: ₹${familyCost} total.\n\n` +
          `Online booking gives you instant QR entry—no waiting in ticket counter lines!`,
      ta: `💰 **${mName} டிக்கெட் கட்டண விவரங்கள்**:\n\n` +
          `• 👨 **பெரியவர்கள்**: ₹${adultP} / நபர்\n` +
          `• 👦 **குழந்தைகள்**: ₹${childP} / நபர் (12 வயதுக்குட்பட்டவர்கள்)\n` +
          `• 👨‍👩‍👧 **குடும்பத்திற்கு (2 பெரியவர்கள் + 1 குழந்தை)**: மொத்தம் ₹${familyCost}.\n\n` +
          `ஆன்லைனில் முன்பதிவு செய்து நுழைவு வரிசையில் நிற்காமல் QR குறியீடு மூலம் எளிதாக நுழையலாம்!`,
      hi: `💰 **${mName} में टिकट दरें**:\n\n` +
          `• 👨 **वयस्क**: ₹${adultP} प्रति व्यक्ति\n` +
          `• 👦 **बच्चे**: ₹${childP} प्रति बच्चा\n` +
          `• 👨‍👩‍👧 **परिवार (2 वयस्क + 1 बच्चा)**: कुल ₹${familyCost}।\n\n` +
          `ऑनलाइन बुक करें और सीधे QR कोड से तेज़ी से प्रवेश पाएं!`,
      es: `💰 **Tarifas de Entradas en ${mName}**:\n\n` +
          `• 👨 **Adulto**: ₹${adultP}\n` +
          `• 👦 **Niño**: ₹${childP}\n` +
          `• 👨‍👩‍👧 **Familia (2 adultos + 1 niño)**: ₹${familyCost} en total.`,
      fr: `💰 **Tarifs au ${mName}**:\n\n` +
          `• 👨 **Adulte**: ₹${adultP}\n` +
          `• 👦 **Enfant**: ₹${childP}\n` +
          `• 👨‍👩‍👧 **Famille (2 adultes + 1 enfant)**: ₹${familyCost} au total.`
    };

    return {
      text: responses[lang] || responses.en,
      action: 'BOOK_TICKETS'
    };
  }

  // 4. TIMINGS / BEST TIME TO VISIT
  if (
    q.includes('time') || q.includes('timing') || q.includes('open') || q.includes('close') || q.includes('best') ||
    q.includes('நேரம்') || q.includes('திறக்கும்') || q.includes('மூடும்') ||
    q.includes('समय') || q.includes('खुलने') || q.includes('बजे') ||
    q.includes('horario') || q.includes('heure')
  ) {
    const responses = {
      en: `🕐 **Operating Timings for ${mName}**:\n\n` +
          `• **Hours**: ${opening} to ${closing}\n` +
          `• 💡 **Pro-Tip / Best Time**: Visit between **9:30 AM – 11:30 AM** or after **3:00 PM** for the calmest experience with minimal crowd. Plan for approximately **1.5 to 2 hours** to view all galleries leisurely.`,
      ta: `🕐 **${mName} திறக்கும் நேரம் மற்றும் சிறந்த நேரம்**:\n\n` +
          `• **நேரம்**: காலை ${opening} மணி முதல் மாலை ${closing} மணி வரை\n` +
          `• 💡 **பரிந்துரை**: கூட்ட நெரிசல் இல்லாமல் நிதானமாக பார்க்க காலை **9:30 முதல் 11:30** வரை அல்லது மாலை **3:00 மணிக்கு மேல்** வருகை தருவது மிகச் சிறந்தது. முழுமையாக சுற்றிப் பார்க்க சுமார் 1.5 முதல் 2 மணி நேரம் தேவைப்படும்.`,
      hi: `🕐 **${mName} का समय और घूमने का सबसे अच्छा समय**:\n\n` +
          `• **समय**: सुबह ${opening} से शाम ${closing} तक\n` +
          `• 💡 **सुझाव**: शांति से देखने के लिए सुबह **9:30 से 11:30** या दोपहर बाद **3:00 बजे** के बाद आएं। संपूर्ण भ्रमण में लगभग 1.5 से 2 घंटे का समय लगता है।`,
      es: `🕐 **Horarios de ${mName}**:\n\n` +
          `• **Abierto**: De ${opening} a ${closing}\n` +
          `• 💡 **Consejo**: Las mejores horas para evitar multitudes son de 9:30 a 11:30 o después de las 15:00.`,
      fr: `🕐 **Horaires pour ${mName}**:\n\n` +
          `• **Ouverture**: De ${opening} à ${closing}\n` +
          `• 💡 **Conseil**: Visitez entre 9h30 et 11h30 pour éviter l'affluence.`
    };

    return { text: responses[lang] || responses.en };
  }

  // 5. ACCESSIBILITY & AMENITIES
  if (
    q.includes('wheelchair') || q.includes('access') || q.includes('disabled') || q.includes('camera') || q.includes('photo') ||
    q.includes('சக்கர') || q.includes('மாற்றுத்திறனாளி') || q.includes('புகைப்படம்') ||
    q.includes('व्हीलचेयर') || q.includes('दिव्यांग') || q.includes('फोटो') ||
    q.includes('silla de ruedas') || q.includes('fauteuil')
  ) {
    const responses = {
      en: `♿ **Accessibility & Guidelines at ${mName}**:\n\n` +
          `• **Wheelchair Access**: Ramps and step-free passages are available across major exhibit areas.\n` +
          `• **Restrooms & Drinking Water**: Clean amenities are located on every gallery floor.\n` +
          `• **Photography**: Non-flash mobile photography is permitted. Tripods and commercial flash photography require prior permission.\n` +
          `• **Luggage/Cloakroom**: Safe storage available at the security desk.`,
      ta: `♿ **வசதிகள் மற்றும் வழிகாட்டுதல்கள் (${mName})**:\n\n` +
          `• **சக்கர நாற்காலி வசதி**: மாற்றுத்திறனாளிகள் மற்றும் முதியவர்களுக்காக சாய்வுதள பாதைகள் அமைக்கப்பட்டுள்ளன.\n` +
          `• **குடிநீர் & கழிப்பறை**: அனைத்து தளங்களிலும் சுகாதாரமான குடிநீர் மற்றும் கழிப்பறை வசதிகள் உள்ளன.\n` +
          `• **புகைப்படம்**: ஃபிளாஷ் இல்லாமல் மொபைல் மூலம் படம் எடுக்க அனுமதி உண்டு.`,
      hi: `♿ **सुविधाएं और दिशानिर्देश (${mName})**:\n\n` +
          `• **व्हीलचेयर पहुंच**: दिव्यांगों व बुजुर्गों के लिए रैंप व आसान मार्ग उपलब्ध हैं।\n` +
          `• **पेयजल व प्रसाधन**: प्रत्येक तल पर स्वच्छ सुविधाएं मौजूद हैं।\n` +
          `• **फोटोग्राफी**: बिना फ्लैश के सामान्य मोबाइल फोटोग्राफी की अनुमति है।`,
      es: `♿ **Accesibilidad y Normas en ${mName}**:\n\n` +
          `• **Acceso en silla de ruedas**: Rampas disponibles en los accesos principales.\n` +
          `• **Fotografía**: Permitida sin flash para uso personal.`,
      fr: `♿ **Accessibilité et Règlement au ${mName}**:\n\n` +
          `• **Accès PMR**: Rampes d'accès disponibles.\n` +
          `• **Photographie**: Autorisée sans flash pour usage personnel.`
    };

    return { text: responses[lang] || responses.en };
  }

  // 6. DEFAULT INTELLIGENT HELPER
  const defaultResponses = {
    en: `I am your AI assistant for **${mName}** in ${location}! 🏛️\n\n` +
        `• 🎫 **Tickets**: Adults ₹${adultP} | Children ₹${childP}\n` +
        `• 🕐 **Hours**: ${opening} – ${closing}\n` +
        `• 📍 **Location**: ${museum?.address || location}\n\n` +
        `You can ask me about exhibits, shows, parking, family tickets, or tap **Book Ticket** below to get your instant QR pass!`,
    ta: `நான் **${mName}** அருங்காட்சியகத்தின் (${location}) AI வழிகாட்டி! 🏛️\n\n` +
        `• 🎫 **கட்டணம்**: பெரியவர்கள் ₹${adultP} | குழந்தைகள் ₹${childP}\n` +
        `• 🕐 **நேரம்**: காலை ${opening} – மாலை ${closing}\n` +
        `• 📍 **முகவரி**: ${museum?.address || location}\n\n` +
        `கண்காட்சிகள், பார்க்கிங் வசதி அல்லது டிக்கெட் முன்பதிவு பற்றி என்னிடம் தாராளமாகக் கேட்கலாம்!`,
    hi: `मैं **${mName}** (${location}) के लिए आपका AI सहायक हूँ! 🏛️\n\n` +
        `• 🎫 **टिकट**: वयस्क ₹${adultP} | बच्चे ₹${childP}\n` +
        `• 🕐 **समय**: सुबह ${opening} से शाम ${closing}\n` +
        `• 📍 **स्थान**: ${museum?.address || location}\n\n` +
        `आप मुझसे प्रदर्शनियों, पार्किंग, या टिकट बुकिंग के बारे में पूछ सकते हैं!`,
    es: `¡Soy tu asistente virtual para **${mName}**! 🏛️\n\n` +
        `• 🎫 **Tarifas**: Adultos ₹${adultP} | Niños ₹${childP}\n` +
        `• 🕐 **Horario**: ${opening} – ${closing}\n\n` +
        `¡Pregúntame lo que necesites sobre el museo o reserva tus entradas!`,
    fr: `Je suis votre assistant IA pour le **${mName}** ! 🏛️\n\n` +
        `• 🎫 **Tarifs**: Adultes ₹${adultP} | Enfants ₹${childP}\n` +
        `• 🕐 **Horaires**: ${opening} – ${closing}\n\n` +
        `N'hésitez pas à me poser vos questions ou à réserver vos billets !`
  };

  return {
    text: defaultResponses[lang] || defaultResponses.en,
    action: 'BOOK_TICKETS'
  };
};

