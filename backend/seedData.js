export const initialContent = {
  hero: {
    summer: {
      title: 'Transform Your Outdoor Space',
      subtitle: 'Professional lawn care that brings your property to life',
      ctaText: 'Get a Free Quote',
      activeProjects: 12,
      responseTime: '< 2 hours',
      satisfactionRate: '99.8%'
    },
    winter: {
      title: 'Clear Paths, Safe Spaces',
      subtitle: 'Reliable snow removal when you need it most',
      ctaText: 'Request Snow Service',
      activeProjects: 12,
      responseTime: '< 2 hours',
      satisfactionRate: '99.8%'
    }
  },

  services: {
    summer: [
      {
        id: 's1',
        title: 'Precision Lawn Care',
        description: 'Weekly maintenance that keeps your lawn looking magazine-ready',
        image: 'https://images.unsplash.com/photo-1734303023491-db8037a21f09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBsYW5kc2NhcGluZyUyMGVxdWlwbWVudHxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        price: 'Starting at $45/visit',
        features: ['Professional mowing patterns', 'Edge trimming', 'Debris removal', 'Seasonal scheduling'],
        color: 'from-green-500 to-emerald-600'
      },
      {
        id: 's2',
        title: 'Landscape Design',
        description: 'Transform your vision into a stunning outdoor reality',
        image: 'https://images.unsplash.com/photo-1746458258536-b9ee5db20a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yJTIwbGFuZHNjYXBpbmd8ZW58MXx8fHwxNzU4MjIxMjA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        price: 'Custom pricing',
        features: ['3D design concepts', 'Plant selection', 'Hardscape installation', 'Ongoing maintenance'],
        color: 'from-amber-500 to-orange-600'
      }
    ],
    winter: [
      {
        id: 's3',
        title: 'Snow Removal',
        description: '24/7 clearing service that keeps you moving all winter long',
        image: 'https://images.unsplash.com/photo-1595391595283-5f057807d054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbm93JTIwcGxvdyUyMHRydWNrJTIwd2ludGVyfGVufDF8fHx8MTc1ODIyMTIwNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        price: 'Starting at $75/plow',
        features: ['Emergency response', 'Salt application', 'Sidewalk clearing', 'Commercial rates available'],
        color: 'from-blue-500 to-indigo-600'
      },
      {
        id: 's4',
        title: 'Ice Management',
        description: 'Proactive treatment to prevent dangerous ice formation',
        image: 'https://images.unsplash.com/photo-1709668741587-cd18a016493c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx3aW50ZXIlMjBzbm93JTIwaG91c2UlMjBkcml2ZXdheXxlbnwxfHx8fDE3NTgyMjEyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        price: 'Seasonal contracts',
        features: ['Pre-treatment application', 'Storm monitoring', 'Liability protection', 'Eco-friendly options'],
        color: 'from-slate-500 to-gray-600'
      }
    ]
  },

  portfolio: {
    summer: [
      {
        id: 'p1',
        title: 'Backyard Makeover',
        category: 'Landscaping',
        description: 'Full landscape redesign with patio and lighting',
        imageUrl: 'https://images.unsplash.com/photo-1606313474141-2313c70d1ba9?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        location: 'Maple Grove, MN',
        duration: '3 weeks',
        featured: true
      },
      {
        id: 'p2',
        title: 'Front Yard Refresh',
        category: 'Maintenance',
        description: 'Edging, seasonal plants, and mulch with crisp lines',
        imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop',
        location: 'Eden Prairie, MN',
        duration: '4 days'
      }
    ],
    winter: [
      {
        id: 'p3',
        title: 'Commercial Snow Route',
        category: 'Snow & Ice',
        description: 'Plowing and ice management for a retail complex',
        imageUrl: 'https://images.unsplash.com/photo-1678309942964-6babf32d8a02?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        location: 'Bloomington, MN',
        duration: 'Seasonal',
        featured: true
      },
      {
        id: 'p4',
        title: 'Residential Driveway',
        category: 'Snow Removal',
        description: 'Storm response with repeat clearings through blizzard',
        imageUrl: 'https://plus.unsplash.com/premium_photo-1661335278560-f50e34f94a64?q=80&w=695&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        location: 'Plymouth, MN',
        duration: '2 days'
      }
    ]
  },

  testimonials: [
    { id: 't1', name: 'Jane D.', role: 'Homeowner', rating: 5, comment: 'Fantastic service, my yard looks amazing!' },
    { id: 't2', name: 'Mark R.', role: 'Facilities Manager', rating: 5, comment: 'Reliable snow removal all winter. Highly recommend.' },
    { id: 't3', name: 'Priya S.', role: 'Property Owner', rating: 4, comment: 'Professional crew and great communication.' }
  ],

  contact: {
    phone: '(587) 987-6057',
    email: 'janjcomp08@gmail.com',
    address: 'Leduc, Alberta, Canada',
    hours: 'Mon-Fri: 7AM-6PM',
    weekendNote: 'Weekend emergency service',
    facebookUrl: 'https://www.facebook.com/jcatapiajrj',
    facebookName: "Jay's Blade and Snow Services",
  }
};
