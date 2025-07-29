export type Todo = {
  type: string;
  priority: 'high' | 'medium' | 'low';
  text: string;
  why: string;
};

export function generateTodos(
  analysis: Record<string, any>,
  industry: string
): { todos: Todo[]; is_fully_satisfied: boolean } {
  const todos: Todo[] = [];

  // Google My Business Checks
  if (!analysis.google?.photos || analysis.google.photos.length === 0) {
    todos.push({
      type: 'Google: Fotos fehlen',
      priority: 'high',
      text: 'Fügen Sie professionelle Bilder bei Google My Business hinzu.',
      why: 'Erhöht Klickrate und Ranking um bis zu 35%.',
    });
  }

  if (!analysis.google?.hasHours) {
    todos.push({
      type: 'Google: Öffnungszeiten fehlen',
      priority: 'high',
      text: 'Hinterlegen Sie vollständige Öffnungszeiten.',
      why: 'Wichtig für lokale Suche und Gästeplanung.',
    });
  }

  if (!analysis.google?.profileComplete) {
    todos.push({
      type: 'Google: Profil unvollständig',
      priority: 'medium',
      text: 'Vervollständigen Sie Ihr Google My Business Profil.',
      why: 'Vollständige Profile werden 42% öfter kontaktiert.',
    });
  }

  // Meta/Facebook Checks
  if (!analysis.meta?.messenger_enabled) {
    todos.push({
      type: 'Meta: Messenger nicht aktiviert',
      priority: 'medium',
      text: 'Aktivieren Sie den Facebook Messenger für direkten Gästekontakt.',
      why: 'Ermöglicht schnelle Anfragen und Buchungen.',
    });
  }

  if (!analysis.meta?.hasPhotos) {
    todos.push({
      type: 'Meta: Fehlende visuelle Inhalte',
      priority: 'medium',
      text: 'Laden Sie hochwertige Fotos auf Ihre Facebook-Seite hoch.',
      why: 'Visuelle Inhalte generieren 94% mehr Engagement.',
    });
  }

  // Instagram Checks
  if (!analysis.instagram?.hasProfile) {
    todos.push({
      type: 'Instagram: Kein Business Account',
      priority: 'medium',
      text: 'Erstellen Sie einen Instagram Business Account.',
      why: 'Erschließt eine wichtige Zielgruppe unter 35 Jahren.',
    });
  } else if (analysis.instagram?.followerCount < 100) {
    todos.push({
      type: 'Instagram: Geringe Reichweite',
      priority: 'low',
      text: 'Erhöhen Sie Ihre Instagram-Follower durch regelmäßige Posts.',
      why: 'Größere Reichweite führt zu mehr Gästen.',
    });
  }

  // Industry-specific checks
  if (industry === 'hospitality') {
    if (!analysis.reservationAvailable) {
      todos.push({
        type: 'Gastronomie: Online-Reservierung fehlt',
        priority: 'high',
        text: 'Integrieren Sie ein Online-Reservierungssystem.',
        why: '68% der Gäste bevorzugen Online-Buchungen.',
      });
    }

    if (analysis.google?.rating && analysis.google.rating < 4.0) {
      todos.push({
        type: 'Gastronomie: Bewertungen verbessern',
        priority: 'high',
        text: 'Implementieren Sie aktives Bewertungsmanagement.',
        why: 'Bewertungen unter 4.0 reduzieren Buchungen um 70%.',
      });
    }
  } else if (industry === 'retail') {
    if (!analysis.hasOnlineShop) {
      todos.push({
        type: 'Einzelhandel: Online-Shop fehlt',
        priority: 'high',
        text: 'Erstellen Sie einen Online-Shop für Ihre Produkte.',
        why: 'Online-Verkäufe steigern Umsatz um durchschnittlich 23%.',
      });
    }
  }

  // Satisfaction logic: no high-priority todos AND score >= 80
  const highPriorityTodos = todos.filter(todo => todo.priority === 'high');
  const score = analysis.score ?? 0;
  const is_fully_satisfied = highPriorityTodos.length === 0 && score >= 80;

  return { todos, is_fully_satisfied };
}