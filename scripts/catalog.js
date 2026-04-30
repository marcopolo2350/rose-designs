// Catalog
const CATALOG_CATEGORY_ORDER=['Seating','Beds','Tables','Storage','Kitchen','Bathroom','Laundry','Lighting','Decor','Rugs','Wall Decor','Openings'];
// Phase ✨ — Category glyphs (small illustrated icons). Returned as inline SVG markup
// so they render consistently across devices without icon-font dependencies.
const CATALOG_GLYPHS={
  Seating:'<svg viewBox="0 0 24 24"><path d="M4 13v4M20 13v4M4 17h16M5 13h14a2 2 0 0 0-2-2h-10a2 2 0 0 0-2 2z"/></svg>',
  Beds:'<svg viewBox="0 0 24 24"><path d="M3 18V8M21 18v-6M3 12h18M3 18h18M7 11h4v1H7z"/></svg>',
  Tables:'<svg viewBox="0 0 24 24"><path d="M3 10h18M5 10v10M19 10v10M3 10l2-4h14l2 4"/></svg>',
  Storage:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16"/><path d="M4 12h16M10 7v2M14 15v2"/></svg>',
  Kitchen:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16"/><path d="M4 10h16M8 14h3M8 17h3M14 14h2M14 17h2"/></svg>',
  Bathroom:'<svg viewBox="0 0 24 24"><path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M7 12V6a2 2 0 0 1 2-2h2"/><circle cx="11" cy="6" r="1"/></svg>',
  Laundry:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1"/><circle cx="12" cy="13" r="5"/><circle cx="7" cy="7" r="1"/></svg>',
  Lighting:'<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 10H10z"/><path d="M11 13v4h2v-4M10 21h4"/></svg>',
  Decor:'<svg viewBox="0 0 24 24"><path d="M10 3c-1.5 3-1.5 6 2 9 3.5 3 3.5 6 2 9M14 3c1.5 3 1.5 6-2 9-3.5 3-3.5 6-2 9"/></svg>',
  Rugs:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 9h18M3 15h18M6 6v12M18 6v12"/></svg>',
  'Wall Decor':'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="14"/><path d="M5 10l3 4 3-3 4 5h4"/><path d="M11 21h2"/></svg>',
  Openings:'<svg viewBox="0 0 24 24"><path d="M4 21V4h9l7 5v12"/><path d="M13 4v17M7 14h3"/></svg>',
};
function categoryGlyphMarkup(cat){
  const svg=CATALOG_GLYPHS[cat]||'';
  return svg?`<span class="cat-glyph">${svg}</span>`:'';
}
const CATEGORY_ALIAS_MAP={'Window Decor':'Openings'};
const COLLECTION_THEMES={
  'Quiet Luxury':'linear-gradient(135deg,#f7f4ef,#ddd2c2)',
  'Warm Modern':'linear-gradient(135deg,#fbf2e7,#dcc3ab)',
  'Tailored Calm':'linear-gradient(135deg,#f3f0ee,#d4dce0)',
  'Everyday Staples':'linear-gradient(135deg,#f6f2eb,#e5ddd0)'
};
const FURN_ITEMS=[
  {label:'Sofa',w:5.2,d:2.55,icon:'???',symbol:'S',assetKey:'sofa',group:'Seating'},
  {label:'Small Sofa',w:3.4,d:2.05,icon:'???',symbol:'S',assetKey:'sofa_small',group:'Seating'},
  {label:'Compact Sofa',w:3.6,d:2.1,icon:'???',symbol:'C',assetKey:'sofa_compact',group:'Seating'},
  {label:'Sofa Medium',w:4.4,d:2.35,icon:'???',symbol:'S',assetKey:'sofa_medium',group:'Seating'},
  {label:'Large Sofa',w:5.8,d:2.6,icon:'???',symbol:'L',assetKey:'sofa_large',group:'Seating'},
  {label:'Grand Sofa',w:6.4,d:2.8,icon:'???',symbol:'G',assetKey:'sofa_grand',group:'Seating'},
  {label:'Modern Sofa',w:5.2,d:2.55,icon:'???',symbol:'M',assetKey:'sofa_modern',group:'Seating'},
  {label:'Sectional Sofa',w:6,d:3.6,icon:'???',symbol:'L',assetKey:'sofa_l',group:'Seating'},
  {label:'Loveseat',w:4,d:2.3,icon:'???',symbol:'L',assetKey:'sofa',group:'Seating'},
  {label:'Chair',w:1.6,d:1.6,icon:'??',symbol:'C',assetKey:'chair',group:'Seating'},
  {label:'Office Chair',w:2,d:2,icon:'??',symbol:'O',assetKey:'chair_office',group:'Seating'},
  {label:'Stool',w:1.4,d:1.4,icon:'??',symbol:'S',assetKey:'stool',group:'Seating'},
  {label:'Bench',w:3.5,d:1.4,icon:'??',symbol:'B',assetKey:'bench',group:'Seating'},
  {label:'Bed',w:6.2,d:7.2,icon:'???',symbol:'B',assetKey:'bed',group:'Beds'},
  {label:'King Bed',w:6.4,d:7.4,icon:'???',symbol:'K',assetKey:'bed_king',group:'Beds'},
  {label:'Double Bed',w:5.5,d:6.8,icon:'???',symbol:'D',assetKey:'bed_double',group:'Beds'},
  {label:'Twin Bed',w:3.6,d:6.6,icon:'???',symbol:'T',assetKey:'bed_twin',group:'Beds'},
  {label:'Bunk Bed',w:4.4,d:6.8,icon:'???',symbol:'U',assetKey:'bunk_bed',group:'Beds'},
  {label:'Coffee Table',w:3.2,d:1.8,icon:'??',symbol:'T',assetKey:'table_coffee',group:'Tables'},
  {label:'Dining Table',w:5,d:3,icon:'???',symbol:'D',assetKey:'dining_table',group:'Tables'},
  {label:'Round Dining Table',w:4.2,d:4.2,icon:'???',symbol:'R',assetKey:'table_round_large',group:'Tables'},
  {label:'Round Side Table',w:2.4,d:2.4,icon:'???',symbol:'R',assetKey:'table_round_small',group:'Tables'},
  {label:'Desk',w:4,d:2,icon:'??',symbol:'K',assetKey:'desk',group:'Tables'},
  {label:'Rectangular Table',w:4.4,d:2.6,icon:'??',symbol:'T',assetKey:'table_rect',group:'Tables'},
  {label:'Bookshelf',w:3.2,d:1.1,icon:'??',symbol:'H',assetKey:'bookshelf',group:'Storage'},
  {label:'Bookcase With Books',w:3.2,d:1.1,icon:'??',symbol:'B',assetKey:'bookcase_books',group:'Storage'},
  {label:'Shelving',w:3.5,d:.6,icon:'??',symbol:'E',assetKey:'shelving',group:'Storage'},
  {label:'Small Shelf',w:2.2,d:.45,icon:'??',symbol:'S',assetKey:'shelf_small',group:'Storage'},
  {label:'Dresser',w:4,d:1.8,icon:'???',symbol:'R',assetKey:'dresser',group:'Storage'},
  {label:'Tall Dresser',w:3.4,d:1.7,icon:'???',symbol:'T',assetKey:'dresser_tall',group:'Storage'},
  {label:'Full Closet',w:3.6,d:1.8,icon:'??',symbol:'C',assetKey:'closet_full',group:'Storage'},
  {label:'TV Console',w:5,d:1.4,icon:'??',symbol:'V',assetKey:'tv_console',group:'Storage'},
  {label:'Low Console',w:4.6,d:1.35,icon:'??',symbol:'L',assetKey:'console_low',group:'Storage'},
  {label:'Nightstand',w:1.7,d:1.5,icon:'??',symbol:'N',assetKey:'nightstand',group:'Storage'},
  {label:'Alt Nightstand',w:1.8,d:1.55,icon:'??',symbol:'A',assetKey:'nightstand_alt',group:'Storage'},
  {label:'Fireplace',w:4.2,d:1.3,icon:'??',symbol:'F',assetKey:'fireplace',group:'Decor'},
  {label:'Floor Lamp',w:1,d:1,icon:'??',symbol:'L',assetKey:'lamp_floor',group:'Lighting'},
  {label:'Stand Lamp',w:1,d:1,icon:'??',symbol:'S',assetKey:'lamp_stand',group:'Lighting'},
  {label:'Table Lamp',w:1,d:1,icon:'???',symbol:'T',assetKey:'lamp_table',group:'Lighting'},
  {label:'Chandelier',w:2.2,d:2.2,icon:'?',symbol:'C',assetKey:'lamp_chandelier',group:'Lighting'},
  {label:'Ceiling Light',w:1.6,d:1.6,icon:'?',symbol:'C',assetKey:'lamp_ceiling',group:'Lighting'},
  {label:'Cube Light',w:1.35,d:1.35,icon:'?',symbol:'Q',assetKey:'lamp_cube',group:'Lighting'},
  {label:'Pendant Light',w:1.7,d:1.7,icon:'?',symbol:'P',assetKey:'lamp_pendant',group:'Lighting'},
  {label:'Wall Lamp',w:1.2,d:.4,icon:'??',symbol:'W',assetKey:'lamp_wall',group:'Lighting'},
  {label:'Plant',w:1.4,d:1.4,icon:'??',symbol:'P',assetKey:'plant_floor',group:'Decor'},
  {label:'Cactus',w:1,d:1,icon:'??',symbol:'C',assetKey:'plant_cactus',group:'Decor'},
  {label:'Leafy Plant',w:1.35,d:1.35,icon:'??',symbol:'L',assetKey:'plant_leafy',group:'Decor'},
  {label:'Palm Plant',w:1.5,d:1.5,icon:'??',symbol:'P',assetKey:'plant_palm',group:'Decor'},
  {label:'Round Plant',w:1.2,d:1.2,icon:'??',symbol:'R',assetKey:'plant_round',group:'Decor'},
  {label:'Shelf Plant',w:1,d:1,icon:'??',symbol:'P',assetKey:'plant_small',group:'Decor'},
  {label:'Area Rug',w:5,d:3.5,icon:'??',symbol:'A',assetKey:'rug',group:'Rugs'},
  {label:'Runner Rug',w:6.5,d:2,icon:'??',symbol:'R',assetKey:'runner_rug',group:'Rugs'},
  {label:'Round Rug',w:4.2,d:4.2,icon:'??',symbol:'O',assetKey:'rug_round',group:'Rugs'},
  {label:'Mirror',w:2,d:.3,icon:'??',symbol:'M',assetKey:'mirror',group:'Wall Decor'},
  {label:'Wall Art I',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_01',group:'Wall Decor'},
  {label:'Wall Art II',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_04',group:'Wall Decor'},
  {label:'Wall Art III',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_06',group:'Wall Decor'},
  {label:'Curtains',w:4,d:.4,icon:'??',symbol:'C',assetKey:'curtains',group:'Openings'},
  {label:'Blinds',w:4,d:.3,icon:'??',symbol:'B',assetKey:'blinds',group:'Openings'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Seating ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Armchair Classic',w:2.6,d:2.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'AC',assetKey:'ph_armchair_01',group:'Seating'},
  {label:'Armchair Modern',w:2.4,d:2.6,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'AM',assetKey:'ph_armchair_modern',group:'Seating'},
  {label:'Armchair Midcentury',w:2.4,d:2.8,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'MC',assetKey:'ph_chair_midcentury',group:'Seating'},
  {label:'Sofa Textured',w:6.2,d:2.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬Â¹',symbol:'ST',assetKey:'ph_sofa_01',group:'Seating'},
  {label:'Sofa Clean',w:6.5,d:2.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬Â¹',symbol:'SC',assetKey:'ph_sofa_02',group:'Seating'},
  {label:'Sofa Upholstered',w:5.8,d:2.6,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬Â¹',symbol:'SU',assetKey:'ph_sofa_03',group:'Seating'},
  {label:'Sofa Wooden Frame',w:5.5,d:2.4,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ¢â‚¬Â¹',symbol:'SW',assetKey:'ph_sofa_painted',group:'Seating'},
  {label:'Ottoman',w:2.4,d:2.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'OT',assetKey:'ph_ottoman_01',group:'Seating'},
  {label:'Accent Chair',w:2.0,d:2.0,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'AC',assetKey:'ph_chair_green',group:'Seating'},
  {label:'Chinese Armchair',w:2.2,d:2.0,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'CA',assetKey:'ph_chair_chinese',group:'Seating'},
  {label:'Wicker Chair',w:1.8,d:1.8,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'WC',assetKey:'ph_chair_gallinera',group:'Seating'},
  {label:'Painted Chair',w:1.6,d:1.6,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'PC',assetKey:'ph_chair_painted',group:'Seating'},
  {label:'Bar Chair',w:1.4,d:1.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'BC',assetKey:'ph_bar_chair',group:'Seating'},
  {label:'Metal Stool',w:1.2,d:1.2,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ¢â‚¬Ëœ',symbol:'MS',assetKey:'ph_stool_metal',group:'Seating'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Tables ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Coffee Table Classic',w:3.8,d:1.8,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CT',assetKey:'ph_coffee_table_01',group:'Tables'},
  {label:'Coffee Table Round',w:2.8,d:2.8,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CR',assetKey:'ph_coffee_round',group:'Tables'},
  {label:'Coffee Table Modern',w:3.5,d:1.8,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CM',assetKey:'ph_coffee_modern',group:'Tables'},
  {label:'Coffee Table Low',w:3.2,d:1.6,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CL',assetKey:'ph_coffee_modern_2',group:'Tables'},
  {label:'Coffee Table Gothic',w:3.0,d:1.8,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CG',assetKey:'ph_coffee_gothic',group:'Tables'},
  {label:'Coffee Table Industrial',w:3.4,d:1.8,icon:'ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¢',symbol:'CI',assetKey:'ph_coffee_industrial',group:'Tables'},
  {label:'Dining Table Wood',w:5.0,d:2.6,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½',symbol:'DW',assetKey:'ph_table_wooden',group:'Tables'},
  {label:'Dining Table Rustic',w:5.5,d:2.8,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½',symbol:'DR',assetKey:'ph_table_wooden_2',group:'Tables'},
  {label:'Dining Table Round',w:3.5,d:3.5,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½',symbol:'RT',assetKey:'ph_table_round',group:'Tables'},
  {label:'Dining Table Painted',w:5.0,d:2.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½',symbol:'DP',assetKey:'ph_table_painted',group:'Tables'},
  {label:'Dining Table Cane',w:4.5,d:2.2,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â½',symbol:'DC',assetKey:'ph_table_gallinera',group:'Tables'},
  {label:'Side Table',w:1.6,d:1.6,icon:'ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â«',symbol:'ST',assetKey:'ph_side_table',group:'Tables'},
  {label:'Side Table Tall',w:1.4,d:1.4,icon:'ÃƒÂ°Ã…Â¸Ã…Â¸Ã‚Â«',symbol:'TT',assetKey:'ph_side_table_tall',group:'Tables'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Storage ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Open Shelf Unit',w:3.2,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â¡',symbol:'SH',assetKey:'ph_shelf_01',group:'Storage'},
  {label:'Bookshelf Worn',w:3.0,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…Â¡',symbol:'BW',assetKey:'ph_bookshelf',group:'Storage'},
  {label:'Console Table',w:3.5,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ‚Âµ',symbol:'CO',assetKey:'ph_console_01',group:'Storage'},
  {label:'Console Chinese',w:3.2,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ‚Âµ',symbol:'CC',assetKey:'ph_console_chinese',group:'Storage'},
  {label:'Cabinet Modern',w:2.8,d:1.0,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Âª',symbol:'CM',assetKey:'ph_cabinet_modern',group:'Storage'},
  {label:'Cabinet Painted',w:2.4,d:0.9,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Âª',symbol:'CP',assetKey:'ph_cabinet_painted',group:'Storage'},
  {label:'Cabinet Vintage',w:2.8,d:1.2,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Âª',symbol:'CV',assetKey:'ph_cabinet_vintage',group:'Storage'},
  {label:'Cabinet Drawer',w:2.4,d:1.0,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Âª',symbol:'CD',assetKey:'ph_cabinet_drawer',group:'Storage'},
  {label:'Chinese Cabinet',w:2.8,d:1.0,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Âª',symbol:'CH',assetKey:'ph_cabinet_chinese',group:'Storage'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Lighting ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Chandelier Classic',w:2.5,d:2.5,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'CH',assetKey:'ph_chandelier_01',group:'Lighting'},
  {label:'Chandelier Globe',w:2.8,d:2.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'CG',assetKey:'ph_chandelier_02',group:'Lighting'},
  {label:'Chandelier Crystal',w:3.0,d:3.0,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'CC',assetKey:'ph_chandelier_03',group:'Lighting'},
  {label:'Chandelier Chinese',w:2.6,d:2.6,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'CN',assetKey:'ph_chandelier_chinese',group:'Lighting'},
  {label:'Lantern Chandelier',w:2.2,d:2.2,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'LC',assetKey:'ph_chandelier_lantern',group:'Lighting'},
  {label:'Ceiling Lamp Modern',w:1.8,d:1.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'CL',assetKey:'ph_lamp_ceiling',group:'Lighting'},
  {label:'Desk Lamp Arm',w:1.0,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'DL',assetKey:'ph_lamp_desk',group:'Lighting'},
  {label:'Industrial Pendant',w:1.2,d:1.2,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'IP',assetKey:'ph_lamp_industrial',group:'Lighting'},
  {label:'Pipe Lamp',w:1.0,d:0.6,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¡',symbol:'PL',assetKey:'ph_lamp_pipe',group:'Lighting'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Beds ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Gothic Bed',w:5.5,d:7.0,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â',symbol:'GB',assetKey:'ph_bed_gothic',group:'Beds'},
  {label:'Nightstand Classic',w:1.8,d:1.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ‚Âµ',symbol:'NC',assetKey:'ph_nightstand_classic',group:'Beds'},
  {label:'Nightstand',w:1.6,d:1.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ‚Âµ',symbol:'NS',assetKey:'ph_nightstand',group:'Beds'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Plants ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Potted Plant Large',w:1.2,d:1.2,icon:'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿',symbol:'PL',assetKey:'ph_plant_potted_01',group:'Plants'},
  {label:'Potted Plant Medium',w:1.4,d:1.4,icon:'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿',symbol:'PM',assetKey:'ph_plant_potted_02',group:'Plants'},
  {label:'Potted Plant Small',w:1.0,d:1.0,icon:'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿',symbol:'PS',assetKey:'ph_plant_potted_04',group:'Plants'},
  {label:'Clay Planter',w:0.8,d:0.8,icon:'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â¿',symbol:'CP',assetKey:'ph_planter_clay',group:'Plants'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Poly Haven Premium Decor ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Ornate Mirror',w:2.0,d:0.2,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ…Â¾',symbol:'OM',assetKey:'ph_mirror_ornate',group:'Decor'},
  {label:'Ceramic Vase',w:0.5,d:0.5,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Âº',symbol:'CV',assetKey:'ph_vase_ceramic_01',group:'Decor'},
  {label:'Brass Vase',w:0.4,d:0.4,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Âº',symbol:'BV',assetKey:'ph_vase_brass_01',group:'Decor'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Kitchen ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Base Cabinet',w:1.5,d:0.65,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â³',symbol:'BC',assetKey:'kitchen_cabinet_base',group:'Kitchen'},
  {label:'Upper Cabinet',w:1.5,d:0.35,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â³',symbol:'UC',assetKey:'kitchen_cabinet_upper',group:'Kitchen'},
  {label:'Kitchen Island',w:4.0,d:2.5,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â³',symbol:'KI',assetKey:'kitchen_island',group:'Kitchen'},
  {label:'Refrigerator',w:2.8,d:2.2,icon:'ÃƒÂ°Ã…Â¸Ã‚Â§Ã…Â ',symbol:'RF',assetKey:'kitchen_fridge',group:'Kitchen'},
  {label:'Gas Range',w:2.5,d:2.0,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¥',symbol:'GR',assetKey:'kitchen_stove',group:'Kitchen'},
  {label:'Range Hood',w:2.5,d:1.0,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¨',symbol:'RH',assetKey:'kitchen_hood',group:'Kitchen'},
  {label:'Sink',w:3.0,d:0.65,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¿',symbol:'SK',assetKey:'kitchen_sink',group:'Kitchen'},
  {label:'Dishwasher',w:1.5,d:1.8,icon:'ÃƒÂ°Ã…Â¸Ã‚Â«Ã‚Â§',symbol:'DW',assetKey:'kitchen_dishwasher',group:'Kitchen'},
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Bathroom ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  {label:'Single Vanity',w:2.5,d:0.6,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¿',symbol:'SV',assetKey:'bathroom_vanity_single',group:'Bathroom'},
  {label:'Double Vanity',w:4.5,d:0.6,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¿',symbol:'DV',assetKey:'bathroom_vanity_double',group:'Bathroom'},
  {label:'Toilet',w:1.2,d:2.0,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â½',symbol:'TO',assetKey:'bathroom_toilet',group:'Bathroom'},
  {label:'Bathtub',w:2.5,d:5.5,icon:'ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â',symbol:'BT',assetKey:'bathroom_tub',group:'Bathroom'},
  {label:'Shower',w:3.0,d:3.0,icon:'ÃƒÂ°Ã…Â¸Ã…Â¡Ã‚Â¿',symbol:'SH',assetKey:'bathroom_shower',group:'Bathroom'},
  {label:'Bathroom Mirror',w:2.5,d:0.2,icon:'ÃƒÂ°Ã…Â¸Ã‚ÂªÃ…Â¾',symbol:'BM',assetKey:'bathroom_mirror',group:'Bathroom'},
  {label:'Towel Bar',w:1.5,d:0.1,icon:'ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Âº',symbol:'TB',assetKey:'bathroom_towel_bar',group:'Bathroom'},
  {label:'Washing Machine',w:2.6,d:2.7,icon:'Ã°Å¸Â§Âº',symbol:'WM',assetKey:'washing_machine',group:'Laundry'},
  {label:'Round Column',w:1.3,d:1.3,icon:'â—¯',symbol:'RC',assetKey:'column_round',group:'Decor'},
  {label:'Small Trashcan',w:1.0,d:1.0,icon:'ðŸ—‘',symbol:'TS',assetKey:'trashcan_small',group:'Decor'},
  {label:'Large Trashcan',w:1.2,d:1.2,icon:'ðŸ—‘',symbol:'TL',assetKey:'trashcan_large',group:'Decor'},
  {label:'Square Plate',w:0.9,d:0.9,icon:'â–£',symbol:'SP',assetKey:'square_plate',group:'Decor'},
];
const DEFAULT_COLLECTIONS=['all','Quiet Luxury','Warm Modern','Tailored Calm'];
let assetManifest=[];
let assetMetaByKey=new Map();
let activeCatalogCollection='all';
let activeCatalogCategory='all';
let catalogFavorites=[];
let catalogRecent=[];
let catalogVariantSelection={};
function normalizeArrayValue(value){
  if(Array.isArray(value))return value.filter(Boolean);
  if(value===null||value===undefined||value==='')return [];
  return [value];
}
function uniqueList(values){return [...new Set((values||[]).filter(Boolean))]}
function normalizeCatalogGroup(group){return CATEGORY_ALIAS_MAP[group]||group||'Decor'}
function catalogCategoryList(){return ['all',...CATALOG_CATEGORY_ORDER]}
function catalogStorageKey(name){return 'catalog_'+name}
function normalizeVariantsValue(value){
  if(!Array.isArray(value))return [];
  return value.filter(Boolean).map((variant,idx)=>({
    id:variant.id||`variant_${idx+1}`,
    label:variant.label||`Variant ${idx+1}`,
    type:variant.type||'material',
    family:variant.family||'finish',
    previewColor:variant.previewColor||variant.color||'',
    accentColor:variant.accentColor||variant.previewColor||variant.color||'',
    roughness:Number.isFinite(variant.roughness)?variant.roughness:null,
    metalness:Number.isFinite(variant.metalness)?variant.metalness:null,
    tintStrength:Number.isFinite(variant.tintStrength)?variant.tintStrength:null,
    thumbnailPath:variant.thumbnailPath||'',
  }));
}
function getItemVariants(item){
  return Array.isArray(item?.variants)?item.variants:[];
}
function itemSupportsVariants(item){
  return getItemVariants(item).length>0;
}
function getVariantById(item,variantId){
  return getItemVariants(item).find(variant=>variant.id===variantId)||null;
}
function getDefaultVariant(item){
  const variants=getItemVariants(item);
  if(!variants.length)return null;
  return getVariantById(item,item?.defaultVariantId)||variants[0];
}
function ensureCatalogVariantSelection(item){
  if(!item?.assetKey||!itemSupportsVariants(item))return '';
  const current=catalogVariantSelection[item.assetKey];
  if(current&&getVariantById(item,current))return current;
  const fallback=getDefaultVariant(item)?.id||'';
  catalogVariantSelection[item.assetKey]=fallback;
  return fallback;
}
function getSelectedCatalogVariant(item){
  return getVariantById(item,ensureCatalogVariantSelection(item))||getDefaultVariant(item);
}
function getFurnitureVariant(record,itemOverride=null){
  const item=itemOverride||getFurnitureCatalogItem(record);
  if(!itemSupportsVariants(item))return null;
  return getVariantById(item,record?.variantId)||getDefaultVariant(item);
}
function variantDisplayColor(record,itemOverride=null){
  const variant=getFurnitureVariant(record,itemOverride);
  if(record?.finishColor&&!record?.variantId)return record.finishColor;
  return variant?.previewColor||record?.finishColor||'';
}
function furnitureVariantFamily(record,itemOverride=null){
  return getFurnitureVariant(record,itemOverride)?.family||'';
}
function setCatalogVariant(assetKey,variantId){
  const item=FURN_ITEM_BY_KEY.get(assetKey);
  if(!item)return;
  const variant=getVariantById(item,variantId);
  if(!variant)return;
  catalogVariantSelection[assetKey]=variant.id;
  if((pendingFurniturePreviewItemRecord()?.assetKey||'')===assetKey){
    updateCatalogPendingUi();
    if(typeof draw==='function')draw();
  }
}
function variantSwatchMarkup(variant){
  const base=variant.previewColor||'#D8CBB8';
  const accent=variant.accentColor||base;
  return `linear-gradient(135deg,${base},${accent})`;
}
function catalogVariantDots(item,limit=4){
  const variants=getItemVariants(item);
  if(!variants.length)return '';
  const dots=variants.slice(0,limit).map(variant=>`<span class="catalog-variant-dot" style="background:${variantSwatchMarkup(variant)}"></span>`).join('');
  const extra=variants.length>limit?`<span class="catalog-variant-count">+${variants.length-limit}</span>`:'';
  return `<span class="catalog-variant-dots">${dots}${extra}</span>`;
}
function buildVariantSelector(item,selectedId,handlerName,scope='catalog'){
  const variants=getItemVariants(item);
  if(!variants.length)return '';
  return `<div class="variant-row">${variants.map(variant=>`<button class="variant-chip${variant.id===selectedId?' sel':''}" type="button" data-action="catalog-variant" data-variant-handler="${esc(handlerName)}" data-asset-key="${esc(item.assetKey||'')}" data-variant-id="${esc(variant.id)}" data-stop-propagation="${scope==='catalog'?'true':'false'}"><span class="variant-chip-dot" style="background:${variantSwatchMarkup(variant)}"></span><span>${esc(variant.label)}</span></button>`).join('')}</div>`;
}
function selectedVariantController(records){
  if(!records.length)return null;
  const items=[...new Set(records.map(record=>getFurnitureCatalogItem(record)?.assetKey).filter(Boolean))];
  if(items.length!==1)return null;
  const item=FURN_ITEM_BY_KEY.get(items[0]);
  if(!itemSupportsVariants(item))return null;
  return item;
}
function applyVariantToFurnitureRecord(record,item,variant){
  if(!record||!item||!variant)return;
  record.variantId=variant.id;
  record.finishColor=variant.previewColor||record.finishColor||'';
}
async function loadCatalogPrefs(){
  catalogFavorites=normalizeArrayValue(await dg(catalogStorageKey('favorites')));
  catalogRecent=normalizeArrayValue(await dg(catalogStorageKey('recent')));
}
function saveCatalogPrefs(){
  ds(catalogStorageKey('favorites'),catalogFavorites.slice(0,36));
  ds(catalogStorageKey('recent'),catalogRecent.slice(0,18));
}
function rememberCatalogRecent(assetKey){
  if(!assetKey)return;
  catalogRecent=[assetKey,...catalogRecent.filter(key=>key!==assetKey)].slice(0,12);
  saveCatalogPrefs();
}
function toggleFavoriteCatalogItem(assetKey){
  if(!assetKey)return;
  catalogFavorites=catalogFavorites.includes(assetKey)
    ? catalogFavorites.filter(key=>key!==assetKey)
    : [assetKey,...catalogFavorites].slice(0,24);
  saveCatalogPrefs();
  const search=document.getElementById('furnSearch');
  if(search)filterFurnPicker(search.value||'');
}
function isFavoriteCatalogItem(assetKey){return catalogFavorites.includes(assetKey)}
function catalogCollections(){
  const set=new Set(DEFAULT_COLLECTIONS);
  FURN_ITEMS.forEach(item=>(item.collections||[]).forEach(name=>set.add(name)));
  return [...set];
}
function itemMatchesCollection(item,collection){
  if(!collection||collection==='all')return true;
  return (item.collections||[]).includes(collection);
}
function itemMatchesCategory(item,category){
  if(!category||category==='all')return true;
  return normalizeCatalogGroup(item.group)===category;
}
function getFurnitureCatalogItem(record){
  return (record?.assetKey&&FURN_ITEM_BY_KEY.get(record.assetKey))||FURN_ITEM_BY_LABEL.get(((record?.label)||'').toLowerCase())||null;
}
function getAssetMeta(assetKey){
  return assetKey?assetMetaByKey.get(assetKey)||null:null;
}
function resolveFurnitureMountType(record={},catalog=null,reg=null){
  const assetKey=record?.assetKey||catalog?.assetKey||'';
  const meta=getAssetMeta(assetKey);
  return record?.mountType||catalog?.mountType||meta?.mountType||reg?.mountType||'floor';
}
function catalogSearchText(item){
  return [item.label,item.group,item.category,...(item.tags||[]),...(item.collections||[]),...(item.recommendedRoomTypes||[]),...getItemVariants(item).flatMap(variant=>[variant.label,variant.type,variant.family])].join(' ').toLowerCase();
}
function catalogCardTone(item){
  const collection=(item.collections||[])[0]||'Everyday Staples';
  return COLLECTION_THEMES[collection]||'linear-gradient(135deg,#f8f4ee,#e9e0d5)';
}
function catalogPlaceholderMarkup(item){
  if(item.thumbnailPath)return `<div class="catalog-thumb-media" style="background-image:url('${esc(item.thumbnailPath)}')"></div>`;
  return `<div class="catalog-thumb-mark">${esc(item.symbol||item.label.charAt(0).toUpperCase())}</div>`;
}
function buildCatalogOptionCard(item,index,compact=false){
  const collection=(item.collections||[])[0]||'Everyday Staples';
  const favClass=isFavoriteCatalogItem(item.assetKey)?' active':'';
  const selectedVariant=getSelectedCatalogVariant(item);
  const variantMeta=itemSupportsVariants(item)?`<span class="catalog-subline">${catalogVariantDots(item)}<span>${esc(selectedVariant?.label||`${getItemVariants(item).length} finishes`)}</span></span>`:'';
  return `<div class="catalog-card furn-option${compact?' compact':''}" role="button" tabindex="0" data-action="catalog-choose-or-place" data-item-index="${index}" data-preview-index="${index}" data-asset-key="${esc(item.assetKey||'')}" data-group="${esc(item.group)}" data-category="${esc(normalizeCatalogGroup(item.group))}" data-collection="${esc((item.collections||[]).join('|'))}" data-label="${esc(catalogSearchText(item))}"><span class="catalog-fav${favClass}" role="button" tabindex="0" data-action="catalog-toggle-favorite" data-asset-key="${esc(item.assetKey||'')}" aria-label="Toggle favorite">&#9733;</span><span class="catalog-selected-badge">Selected</span><span class="catalog-thumb" style="background:${catalogCardTone(item)}">${catalogPlaceholderMarkup(item)}</span><span class="catalog-meta"><span class="catalog-title">${esc(item.label)}</span><span class="catalog-sub">${esc(collection)}</span>${variantMeta}</span></div>`;
}
function catalogItemsForKeys(keys){return keys.map(key=>FURN_ITEM_BY_KEY.get(key)).filter(Boolean)}
async function loadAssetManifest(){
  try{
    const res=await fetch('./data/asset-manifest.json',{cache:'no-store'});
    if(!res.ok)return;
    const json=await res.json();
    if(!Array.isArray(json))return;
    assetManifest=json.map(entry=>({
      ...entry,
      category:normalizeCatalogGroup(entry.category),
      tags:normalizeArrayValue(entry.tags),
      collections:normalizeArrayValue(entry.collections),
      recommendedRoomTypes:normalizeArrayValue(entry.recommendedRoomTypes),
      variants:normalizeVariantsValue(entry.variants),
    }));
    window.assetManifest=assetManifest;
    assetMetaByKey=new Map(assetManifest.map(entry=>[entry.id,entry]));
    assetManifest.forEach(entry=>{
      if(!MODEL_REGISTRY[entry.id])return;
      if(entry.mountType)MODEL_REGISTRY[entry.id].mountType=entry.mountType;
      if(entry.snapToOpening!==undefined)MODEL_REGISTRY[entry.id].snapToOpening=!!entry.snapToOpening;
    });
    FURN_ITEMS.forEach(item=>{
      const meta=item.assetKey?assetMetaByKey.get(item.assetKey):null;
      item.group=normalizeCatalogGroup(meta?.category||item.group);
      item.category=GROUP_CATEGORY_MAP[item.group]||'decor';
      item.mountType=item.mountType||meta?.mountType||MODEL_REGISTRY[item.assetKey]?.mountType||'floor';
      item.rotationPolicy=item.rotationPolicy||'free';
      item.defaultFacing=item.defaultFacing||MODEL_REGISTRY[item.assetKey]?.defaultFacing||'forward';
      item.tags=uniqueList([...(item.tags||[]),...(meta?.tags||[])]);
      item.collections=uniqueList([...(item.collections||[]),...(meta?.collections||[])]);
      item.recommendedRoomTypes=uniqueList([...(item.recommendedRoomTypes||[]),...(meta?.recommendedRoomTypes||[])]);
      item.thumbnailPath=meta?.thumbnailPath||item.thumbnailPath||'';
      item.variants=meta?.variants||item.variants||[];
      item.defaultVariantId=meta?.defaultVariantId||item.defaultVariantId||(item.variants?.[0]?.id||'');
    });
    await loadCatalogPrefs();
  }catch(_){}
}
const FURN_ITEM_BY_KEY=new Map(FURN_ITEMS.filter(item=>item.assetKey).map(item=>[item.assetKey,item]));
const FURN_ITEM_BY_LABEL=new Map(FURN_ITEMS.map(item=>[(item.label||'').toLowerCase(),item]));
function normalizeFurnitureRecord(f){
  const catalog=getFurnitureCatalogItem(f);
  const assetKey=f.assetKey||catalog?.assetKey||inferAssetKey(f.label,f.mountType||catalog?.mountType);
  const reg=assetKey?MODEL_REGISTRY[assetKey]:null;
  const mountType=resolveFurnitureMountType({...f,assetKey},catalog,reg);
  const type=resolveLabel(f.label||catalog?.label);
  const redesignAction=EXISTING_ACTIONS[f.redesignAction]?f.redesignAction:'keep';
  const variant=getVariantById(catalog,f.variantId)||(!f.finishColor?getDefaultVariant(catalog):null);
  return {
    id:f.id||uid(),
    label:f.label||catalog?.label||'Item',
    category:f.category||catalog?.category||reg?.category||type||'decor',
    x:Number.isFinite(f.x)?f.x:0,
    z:Number.isFinite(f.z)?f.z:0,
    w:Number.isFinite(f.w)?f.w:(catalog?.w||2),
    d:Number.isFinite(f.d)?f.d:(catalog?.d||1.5),
    rotation:Number.isFinite(f.rotation)?f.rotation:0,
    mountType,
    elevation:Number.isFinite(f.elevation)?f.elevation:defaultElevation(mountType,assetKey,type),
    assetKey,
    yOffset:Number.isFinite(f.yOffset)?f.yOffset:(reg?.yOffset||0),
    finishColor:f.finishColor||(variant?.previewColor||''),
    variantId:f.variantId||(variant?.id||''),
    visible:f.visible!==false,
    source:f.source==='existing'?'existing':'new',
    redesignAction,
    locked:!!f.locked,
    linkedExistingId:f.linkedExistingId||'',
    replacementId:f.replacementId||'',
  };
}
let pendFurnPos=null;
let pendFurnPreviewKey='';
let pendFurnPreviewLabel='';
let pendFurnPreviewIdx=-1;
function pendingFurniturePreviewItemRecord(){
  if(pendFurnPreviewIdx>=0&&FURN_ITEMS[pendFurnPreviewIdx])return FURN_ITEMS[pendFurnPreviewIdx];
  if(pendFurnPreviewKey)return FURN_ITEM_BY_KEY.get(pendFurnPreviewKey)||FURN_ITEMS.find(item=>item.assetKey===pendFurnPreviewKey)||null;
  return null;
}
function pendingFurnitureBarMarkup(item,state){
  if(!item)return '<div class="catalog-placement-bar empty">Pick a piece to see where it will land.</div>';
  const location=state?.snapped?`${formatDistance(state.snapped.x,'compact')} | ${formatDistance(state.snapped.z,'compact')}`:'Choose a spot in the room';
  const statusText=state?.valid?'Ready to place':(state?.reason||'Move the target inside the room');
  const statusClass=state?.valid?'valid':'invalid';
  const selectedVariant=getSelectedCatalogVariant(item);
  const mobileCta=isTouchUi()&&window.innerWidth<=760
    ? `<button class="mini-chip${state?.valid?'':' secondary'}" type="button" ${state?.valid?'data-action="catalog-place-pending"':'disabled'}>${state?.valid?'Place Here':'Adjust Target'}</button>`
    : `<div class="catalog-placement-inline">${state?.valid?'Click the card again to place it.':'Move the target in the room, then click again.'}</div>`;
  const variantUi=itemSupportsVariants(item)
    ? `<div class="catalog-placement-variants"><div class="catalog-placement-copy">Style Variant | ${esc(selectedVariant?.label||'')}</div>${buildVariantSelector(item,selectedVariant?.id||'', 'setCatalogVariant','catalog')}</div>`
    : '';
  return `<div class="catalog-placement-bar ${statusClass}"><div class="catalog-placement-meta"><div class="catalog-placement-title">${esc(item.label)}</div><div class="catalog-placement-copy">${esc(statusText)} | ${esc(location)}</div>${variantUi}</div>${mobileCta}</div>`;
}
function updateCatalogPendingUi(){
  const item=pendingFurniturePreviewItemRecord();
  const state=typeof getPendingFurniturePlacementState==='function'?getPendingFurniturePlacementState(curRoom):null;
  const bar=document.getElementById('catalogPlacementBar');
  if(bar)bar.innerHTML=pendingFurnitureBarMarkup(item,state);
  document.querySelectorAll('.furn-option').forEach(card=>{
    const active=(card.dataset.assetKey||'')===(item?.assetKey||'');
    card.classList.toggle('selected',active);
  });
}
function setPendingFurniturePreview(item,idx=-1){
  pendFurnPreviewKey=item?.assetKey||'';
  pendFurnPreviewLabel=item?.label||'';
  pendFurnPreviewIdx=Number.isFinite(idx)&&idx>=0?idx:FURN_ITEMS.indexOf(item);
  ensureCatalogVariantSelection(item);
  updateCatalogPendingUi();
  if(typeof draw==='function')draw();
}
function clearPendingFurniturePreview(){
  pendFurnPreviewKey='';
  pendFurnPreviewLabel='';
  pendFurnPreviewIdx=-1;
  updateCatalogPendingUi();
  if(typeof draw==='function')draw();
}
function updatePendingFurnitureTarget(wp){
  if(!wp)return;
  pendFurnPos={x:wp.x,y:wp.y};
  updateCatalogPendingUi();
  if(typeof draw==='function')draw();
}
function showFurnPicker(wp){
  pendFurnPos=wp;
  furnQuery='';
  activeCatalogCollection='all';
  activeCatalogCategory='all';
  const suggested=getSuggestedItems(curRoom);
  const favoriteItems=catalogItemsForKeys(catalogFavorites);
  const recentItems=catalogItemsForKeys(catalogRecent);
  const collectionButtons=catalogCollections().map(name=>`<button class="mini-chip${name===activeCatalogCollection?'':' secondary'}" type="button" data-action="catalog-select-collection" data-collection="${esc(name)}" style="padding:8px 11px;font-size:9px">${esc(name==='all'?'All Collections':name)}</button>`).join('');
  const categoryButtons=catalogCategoryList().map(name=>`<button class="mini-chip${name===activeCatalogCategory?'':' secondary'}" type="button" data-action="catalog-select-category" data-category="${esc(name)}" style="padding:8px 11px;font-size:9px">${esc(name==='all'?'All Categories':name)}</button>`).join('');
  const section=(title,key,items,compact=false)=>items.length?'<div class="furn-group" data-group="'+esc(key)+'"><div class="catalog-section-title">'+categoryGlyphMarkup(title)+esc(title)+'</div><div class="catalog-grid'+(compact?' compact':'')+'">'+items.map(item=>buildCatalogOptionCard(item,FURN_ITEMS.indexOf(item),compact)).join('')+'</div></div>':'';
  const roomLabel=(ROOM_TYPES.find(t=>t.id===(curRoom?.roomType||'living_room'))||ROOM_TYPES[0]).name;
  const html='<div class="catalog-overlay" id="furnPickOv" data-action="catalog-overlay-close"><div class="catalog-sheet"><div class="catalog-grabber"></div><div class="catalog-head"><div><div class="catalog-heading">Bring Something Beautiful In</div><div class="catalog-copy">Search the curated catalog, save favorites, and drop pieces in with confidence.</div></div><button class="mini-chip secondary" type="button" data-action="catalog-close">Close</button></div><input id="furnSearch" type="search" placeholder="Search sofa, bed, lamp, console, romantic..." data-action="catalog-search" class="catalog-search"><div class="catalog-placement-note">The canvas keeps showing the drop target while you browse. Tap or drag in the room to move it. On phone, use Place Here when the target looks right.</div><div id="catalogPlacementBar"></div><div class="catalog-chip-row">'+collectionButtons+'</div><div class="catalog-chip-row catalog-chip-row-alt">'+categoryButtons+'</div>'+section('Favorites','favorites',favoriteItems,true)+section('Recent','recent',recentItems,true)+section('Quick Picks For '+roomLabel,'quick',suggested,true)+CATALOG_CATEGORY_ORDER.map(group=>section(group,group,FURN_ITEMS.filter(f=>normalizeCatalogGroup(f.group)===group),false)).join('')+'<div id="furnEmpty" class="catalog-empty">No matches yet. Try a broader word like sofa, bed, rug, mirror, or storage.</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  setPendingFurniturePreview(suggested[0]||favoriteItems[0]||recentItems[0]||FURN_ITEMS[0]||null);
  filterFurnPicker('');
}
function closeFurnPick(){const ov=document.getElementById('furnPickOv');if(ov)ov.remove();pendFurnPos=null;clearPendingFurniturePreview()}
function setCatalogCollection(collection){
  activeCatalogCollection=collection||'all';
  const search=document.getElementById('furnSearch');
  filterFurnPicker(search?search.value:'');
  document.querySelectorAll('#furnPickOv .catalog-chip-row:not(.catalog-chip-row-alt) .mini-chip').forEach(btn=>{
    const active=btn.textContent.trim()===(activeCatalogCollection==='all'?'All Collections':activeCatalogCollection);
    btn.classList.toggle('secondary',!active);
  });
}
function setCatalogCategory(category){
  activeCatalogCategory=category||'all';
  const search=document.getElementById('furnSearch');
  filterFurnPicker(search?search.value:'');
  document.querySelectorAll('#furnPickOv .catalog-chip-row-alt .mini-chip').forEach(btn=>{
    const active=btn.textContent.trim()===(activeCatalogCategory==='all'?'All Categories':activeCatalogCategory);
    btn.classList.toggle('secondary',!active);
  });
}
function filterFurnPicker(query){
  furnQuery=(query||'').trim().toLowerCase();
  const options=[...document.querySelectorAll('.furn-option')];
  const groups=[...document.querySelectorAll('.furn-group')];
  options.forEach(el=>{
    const collectionMatch=activeCatalogCollection==='all'||(el.dataset.collection||'').split('|').includes(activeCatalogCollection);
    const categoryMatch=activeCatalogCategory==='all'||(el.dataset.category||'')===activeCatalogCategory;
    const textMatch=!furnQuery||el.dataset.label.includes(furnQuery);
    const match=collectionMatch&&categoryMatch&&textMatch;
    el.dataset.match=match?'1':'0';
    el.style.display=match?'':'none';
  });
  groups.forEach(group=>{
    const visible=[...group.querySelectorAll('.furn-option')].some(el=>el.dataset.match==='1');
    group.style.display=visible?'':'none';
  });
  const anyVisible=options.some(el=>el.dataset.match==='1');
  const empty=document.getElementById('furnEmpty');
  if(empty)empty.style.display=anyVisible?'none':'block';
  const firstVisible=options.find(el=>el.dataset.match==='1');
  if(firstVisible){
    const item=FURN_ITEM_BY_KEY.get(firstVisible.dataset.assetKey)||null;
    if(item&&item.assetKey!==pendFurnPreviewKey)setPendingFurniturePreview(item);
  }
  updateCatalogPendingUi();
}
function chooseOrPlaceFurn(itemIdx){
  const item=FURN_ITEMS[itemIdx];
  if(!item)return;
  const touchFlow=isTouchUi()&&window.innerWidth<=760;
  if(touchFlow){
    setPendingFurniturePreview(item,itemIdx);
    return;
  }
  placeFurn(itemIdx);
}
function confirmPendingFurniturePlacement(){
  if(pendFurnPreviewIdx<0)return;
  const state=typeof getPendingFurniturePlacementState==='function'?getPendingFurniturePlacementState(curRoom):null;
  if(state&&!state.valid){
    toast(state.reason||'Move the target inside the room');
    return;
  }
  placeFurn(pendFurnPreviewIdx);
}
function placeFurn(itemIdx){
  if(!pendFurnPos||!curRoom)return;
  const item=FURN_ITEMS[itemIdx];
  if(!item)return;
  const variant=getSelectedCatalogVariant(item);
  const state=typeof getPendingFurniturePlacementState==='function'?getPendingFurniturePlacementState(curRoom):null;
  if(state&&!state.valid){
    toast(state.reason||'Move the target inside the room');
    updateCatalogPendingUi();
    draw();
    return;
  }
  const reg=item.assetKey?MODEL_REGISTRY[item.assetKey]:null;
  const targetRoom=state?.targetRoom||curRoom;
  const pos=state?.snapped||snapFurniturePoint(pendFurnPos.x,pendFurnPos.y);
  const wallAngle=state?.wallSnap?.angle;
  const mountType=resolveFurnitureMountType(item,item,reg);
  targetRoom.furniture.push(normalizeFurnitureRecord({
    id:uid(),
    label:item.label,
    category:item.category,
    x:pos.x,
    z:pos.z,
    w:item.w,
    d:item.d,
    rotation:Number.isFinite(wallAngle)?Math.round((-wallAngle*180/Math.PI)*10)/10:0,
    mountType,
    elevation:Number.isFinite(item.elevation)?item.elevation:defaultElevation(mountType,item.assetKey,resolveLabel(item.label)),
    assetKey:item.assetKey,
    yOffset:reg?.yOffset||0,
    variantId:variant?.id||'',
    finishColor:variant?.previewColor||'',
    visible:true
  }));
  const idx=targetRoom.furniture.length-1;
  tool='select';
  document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));
  if(targetRoom!==curRoom&&typeof openEd==='function')openEd(targetRoom);
  setFurnitureSelection(idx);
  if(isTouchUi()&&window.innerWidth<=760)panelHidden=true;
  rememberCatalogRecent(item.assetKey);
  pushU();closeFurnPick();draw();showP();
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ PROPS ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function getWallStylePreset(room=curRoom){
  return WALL_PALETTES.find(w=>w.id===(room?.materials?.wallFinish||'warm_white'))||WALL_PALETTES[0];
}
function getFloorStylePreset(room=curRoom){
  return FLOOR_TYPES.find(f=>f.id===(room?.materials?.floorType||'light_oak'))||FLOOR_TYPES[0];
}
function wallColorIsCustom(room=curRoom){
  return !!room?.materials?.wallColorCustom;
}
function floorColorIsCustom(room=curRoom){
  return !!room?.materials?.floorColorCustom;
}
function setWallPaint(color){
  if(!curRoom)return;
  curRoom.materials.wall=normalizeColorValue(color,getWallStylePreset(curRoom).color);
  curRoom.materials.wallColorCustom=true;
  roomStyleChanged();
}
function setWallFinish(id){
  if(!curRoom)return;
  const match=WALL_PALETTES.find(w=>w.id===id);
  if(!match)return;
  curRoom.materials.wallFinish=id;
  curRoom.materials.wall=match.color;
  curRoom.materials.wallColorCustom=false;
  roomStyleChanged();
}
function resetWallColorToStyle(){
  if(!curRoom)return;
  const match=getWallStylePreset(curRoom);
  curRoom.materials.wall=match.color;
  curRoom.materials.wallColorCustom=false;
  roomStyleChanged();
}
function setFloorPaint(color){
  if(!curRoom)return;
  curRoom.materials.floor=normalizeColorValue(color,getFloorStylePreset(curRoom).color);
  curRoom.materials.floorColorCustom=true;
  roomStyleChanged();
}
function setFloorType(type){
  if(!curRoom)return;
  const match=FLOOR_TYPES.find(f=>f.id===type);
  if(!match)return;
  curRoom.materials.floorType=match.id;
  curRoom.materials.floor=match.color;
  curRoom.materials.floorColorCustom=false;
  roomStyleChanged();
}
function resetFloorColorToStyle(){
  if(!curRoom)return;
  const match=getFloorStylePreset(curRoom);
  curRoom.materials.floor=match.color;
  curRoom.materials.floorColorCustom=false;
  roomStyleChanged();
}
function setTrimColor(color){if(!curRoom)return;curRoom.materials.trim=normalizeColorValue(color,TRIM_COLORS[0]);roomStyleChanged()}
function setCeilingBrightness(v){if(!curRoom)return;curRoom.materials.ceilingBrightness=Math.max(.7,Math.min(1.35,parseFloat(v)||1));roomStyleChanged()}
function setLightingPreset(id){
  if(!curRoom)return;
  curRoom.materials.lightingPreset=id;
  if(!Number.isFinite(curRoom.materials.lightCharacter)){
    curRoom.materials.lightCharacter=({daylight:.38,warm_evening:.76,soft_lamp_glow:.84,moody:.92,bright_studio:.28}[id]??.5);
  }
  roomStyleChanged();
}
function setLightCharacter(v){
  if(!curRoom)return;
  curRoom.materials.lightCharacter=Math.max(0,Math.min(1,parseFloat(v)||0));
  roomStyleChanged();
}
function setRoomType(id){if(!curRoom)return;curRoom.roomType=id;pushU();draw();showP()}
// Style Moves removed — use Wall Style / Floor Style / Lighting Mood directly.
function nudgeStyle(){}
function applyDesignPresetToRoom(room,id){
  if(!room)return;
  const preset=DESIGN_PRESETS.find(p=>p.id===id);
  if(!preset)return;
  room.designPreset=id;
  room.roomType=room.roomType||preset.roomType||'living_room';
  const wall=WALL_PALETTES.find(w=>w.id===preset.wallFinish);
  const floor=FLOOR_TYPES.find(f=>f.id===preset.floorType);
  if(wall){room.materials.wallFinish=wall.id;room.materials.wall=wall.color;room.materials.wallColorCustom=false;}
  if(floor){room.materials.floorType=floor.id;room.materials.floor=floor.color;room.materials.floorColorCustom=false;}
  room.materials.trim=preset.trim||room.materials.trim;
  room.materials.lightingPreset=preset.lightingPreset||room.materials.lightingPreset;
  room.materials.lightCharacter=({daylight:.38,warm_evening:.76,soft_lamp_glow:.84,moody:.92,bright_studio:.28}[room.materials.lightingPreset]??room.materials.lightCharacter??.5);
  room.materials.ceilingBrightness=Number.isFinite(preset.ceilingBrightness)?preset.ceilingBrightness:(room.materials.ceilingBrightness||1);
  room.mood=preset.mood||room.mood;
}
function applyDesignPreset(id){
  if(!curRoom)return;
  const preset=DESIGN_PRESETS.find(p=>p.id===id);
  if(!preset)return;
  applyDesignPresetToRoom(curRoom,id);
  roomStyleChanged();
  toast(`${preset.name} applied`);
}
function getSuggestedItems(room){
  const type=ROOM_TYPES.find(t=>t.id===(room?.roomType||'living_room'))||ROOM_TYPES[0];
  const preset=DESIGN_PRESETS.find(p=>p.id===room?.designPreset)||null;
  const presetSuggestions=Array.isArray(preset?.suggestions)?preset.suggestions:[];
  const typeSuggestions=Array.isArray(type?.suggestions)?type.suggestions:[];
  const keys=[...presetSuggestions,...typeSuggestions];
  const seen=new Set();
  return keys
    .filter(key=>typeof key==='string'&&key)
    .filter(key=>seen.has(key)?false:(seen.add(key),true))
    .map(key=>FURN_ITEMS.find(item=>item.assetKey===key))
    .filter(Boolean)
    .slice(0,8);
}
function setClosetStyle(id){
  if(!curRoom)return;
  curRoom.materials.closetStyle=id;
  curRoom.structures.forEach(st=>{if(st.type==='closet'&&st.rect)st.finish=id});
  pushU();draw();showP();if(is3D)rebuild3D();
}
function setSelectedFurnitureVariant(_assetKey,variantId){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  const item=selectedVariantController(records)||getFurnitureCatalogItem(records[0]);
  if(!item)return;
  const variant=getVariantById(item,variantId);
  if(!variant)return;
  records.forEach(record=>applyVariantToFurnitureRecord(record,item,variant));
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function setFurnitureFinish(color){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(item=>item.finishColor=color||'');
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function rotateSelectedFurniture(delta){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(f=>{
    let next=((Number(f.rotation)||0)+Number(delta||0))%360;
    if(next<0)next+=360;
    f.rotation=next;
  });
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function turnAroundSelectedFurniture(){rotateSelectedFurniture(180)}
function uRoomHeight(v){curRoom.height=parseDistanceInput(v,curRoom.height||9)||9;curRoom.structures.forEach(st=>{if(st.type==='closet'&&st.rect)st.height=curRoom.height});draw();showP();pushU();scheduleRebuild3D()}
let panelHidden=false;
let roomPanelGroup='build';
let designPresetPanelOpen=false;
let pendingDesignPresetId='';
function isTouchUi(){return Math.max(navigator.maxTouchPoints||0,0)>0}
function mobilePanelShouldPeek(){
  if(!isTouchUi()||window.innerWidth>760)return false;
  if(!curRoom)return false;
  if(tool==='furniture')return true;
  if(sel.type==='furniture'||sel.type==='opening'||sel.type==='structure')return true;
  if(!sel.type||sel.idx<0)return true;
  return false;
}
function propSection(title,body){return `<div class="prop-section"><div class="prop-sec-title">${title}</div>${body}</div>`}
function setRoomPanelGroup(group){
  roomPanelGroup=group||'build';
  panelHidden=false;
  showP();
}
function roomPanelTabs(){
  const groups=[['build','Build'],['style','Style'],['furnish','Furnish'],['present','Present']];
  return `<div class="prop-group-tabs">${groups.map(([id,label])=>`<button class="prop-group-tab${roomPanelGroup===id?' sel':''}" type="button" data-action="room-panel-group" data-group="${id}">${label}</button>`).join('')}</div>`;
}
function toggleDesignPresetPanel(){
  designPresetPanelOpen=!designPresetPanelOpen;
  if(designPresetPanelOpen&&!pendingDesignPresetId)pendingDesignPresetId=curRoom?.designPreset||DESIGN_PRESETS[0]?.id||'';
  showP();
}
function selectPendingDesignPreset(id){
  pendingDesignPresetId=id;
  showP();
}
function applyPendingDesignPreset(){
  if(!pendingDesignPresetId)return;
  applyDesignPreset(pendingDesignPresetId);
  designPresetPanelOpen=false;
  pendingDesignPresetId=curRoom?.designPreset||pendingDesignPresetId;
  showP();
}
function colorInputValue(value,fallback='#ffffff'){
  return normalizeColorValue(value,fallback);
}
function planViewMeaning(mode){
  if(mode==='combined')return 'Overlay existing pieces and the redesign together.';
  if(mode==='existing')return 'Show only the room as it exists today.';
  return 'Show only the new concept pieces and changes.';
}
function updatePanelTabLabel(){
  const tab=document.getElementById('propsTab');
  if(!tab)return;
  const ref=typeof roomReference==='function'&&curRoom?roomReference(curRoom):null;
  if(ref?.calibrationActive)tab.textContent='Open Tracing Tools';
  else if(tool==='furniture')tab.textContent='Open Placement Tools';
  else if(!sel.type||sel.idx<0){
    const labels={build:'Open Build Tools',style:'Open Style Tools',furnish:'Open Furnish Tools',present:'Open Presentation Tools'};
    tab.textContent=labels[roomPanelGroup]||'Open Room Tools';
  }
  else if(sel.type==='furniture')tab.textContent='Open Item Panel';
  else tab.textContent='Open Details';
}
const LIGHTING_PRESET_HELP={
  daylight:'Bright, airy daylight for checking colors and keeping the room open.',
  warm_evening:'Golden evening light that makes the room feel softer and more intimate.',
  soft_lamp_glow:'Mostly practical lamp light with a gentle cozy falloff around the room.',
  moody:'Low, dramatic light with deeper shadows and a more cinematic feel.',
  bright_studio:'Even, neutral brightness for styling, staging, and clear presentation shots.',
};
function lightingPresetHelp(id){
  return LIGHTING_PRESET_HELP[id]||'Changes the 3D mood, exposure, and practical light balance for this room.';
}
function ceilingBrightnessLabel(room){
  const value=room?.materials?.ceilingBrightness||1;
  if(value>=1.18)return 'Ceiling is helping bounce a lot of light back into the room.';
  if(value<=0.88)return 'Ceiling is intentionally toned down for a moodier top plane.';
  return 'Ceiling is staying close to its natural painted brightness.';
}
function lightCharacterLabel(room){
  const value=Math.max(0,Math.min(1,room?.materials?.lightCharacter??.5));
  if(value<=.2)return 'Cool early daylight with a higher, crisper sun.';
  if(value<=.45)return 'Balanced daylight that keeps colors honest and natural.';
  if(value<=.7)return 'Soft late-day warmth with a gentler sun angle.';
  if(value<=.88)return 'Golden-hour warmth that feels calmer and more cinematic.';
  return 'Blue-hour mood with warmer practical lights and deeper shadows.';
}
function referenceCalibrationStatus(ref){
  const count=(ref?.calibrationPoints||[]).length;
  if(!ref?.src)return 'Import a floor plan image, PDF, or room photo to start tracing.';
  if(ref?.calibrationActive&&count===0)return 'Calibration is waiting for the first known point on the reference.';
  if(ref?.calibrationActive&&count===1)return 'First point saved. Tap the second known point to measure the span.';
  if(ref?.calibrationActive&&count===2)return 'Distance ready. Confirm the real measured length in the calibration sheet.';
  return ref?.locked
    ? 'Reference is locked, so tracing clicks stay on the room instead of moving the overlay.'
    : 'Reference is unlocked. Drag it into place, then lock it again before tracing walls.';
}
function restyleRoomPanelText(panel){
  if(!panel)return;
  const floorButtons=[...panel.querySelectorAll('.mat-grid.tall .mat-btn[data-action="set-active-floor"]')];
  floorButtons.forEach(btn=>{
    const raw=(btn.textContent||'').replace(/\s+/g,' ').trim();
    const match=raw.match(/^(.*?)(\d+)\s*$/);
    if(!match)return;
    const label=match[1].replace(/[|·ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â]+/g,' ').replace(/\s+/g,' ').trim()||'Floor';
    const count=Number(match[2]);
    btn.innerHTML=`<span class="mat-btn-title">${esc(label)}</span><span class="mat-btn-meta">${count} room${count===1?'':'s'}</span>`;
  });
  panel.querySelectorAll('.room-card-meta,.prop-tip,.prop-state').forEach(node=>{
    node.textContent=(node.textContent||'').replace(/[ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â]+/g,' ').replace(/\s*[·|]\s*/g,' | ').replace(/\s+/g,' ').trim();
  });
}
function projectRoomMetaLine(room,projectRoot){
  const optionCount=optionSiblings(room).length;
  const connectionCount=(room.connections||[]).filter(link=>projectRooms(projectRoot).some(candidate=>candidate.id===link.roomId||(candidate.baseRoomId||candidate.id)===link.roomId)).length;
  const parts=[room.floorLabel||'Floor 1'];
  if(optionCount>1)parts.push(`${optionCount} options`);
  if(connectionCount)parts.push(`${connectionCount} connection${connectionCount===1?'':'s'}`);
  return parts.join(' | ');
}
function projectRoomMoveTargetsMarkup(room,floors){
  const currentFloorId=room.floorId||'floor_1';
  const targets=floors.filter(floor=>floor.id!==currentFloorId);
  if(!targets.length)return '';
  const baseId=room.baseRoomId||room.id;
  return `<div class="room-floor-targets">${targets.map(floor=>`<button class="mini-chip secondary" type="button" data-action="move-project-room-to-floor" data-room-id="${baseId}" data-floor-id="${floor.id}">Send to ${esc(floor.label)}</button>`).join('')}</div>`;
}
function projectRoomCardMarkup(room,projectRoot,floors){
  const baseId=room.baseRoomId||room.id;
  const active=(curRoom.baseRoomId||curRoom.id)===baseId;
  return `<div class="room-card-mini${active?' active':''}">
    <div class="room-card-main" data-action="open-project-room" data-room-id="${baseId}">
      <div class="room-card-kicker">${active?'Current room':'Room'}</div>
      <div class="room-card-title">${esc(room.name||'Room')}</div>
      <div class="room-card-meta">${esc(projectRoomMetaLine(room,projectRoot))}</div>
    </div>
    <div class="room-card-actions">
      <button class="mini-chip secondary" type="button" data-action="open-project-room" data-room-id="${baseId}">${active?'Stay Here':'Open'}</button>
      <button class="mini-chip secondary" type="button" data-action="duplicate-project-room" data-room-id="${baseId}">Duplicate</button>
      <button class="mini-chip secondary" type="button" data-action="delete-project-room" data-room-id="${baseId}">Delete</button>
    </div>
    ${projectRoomMoveTargetsMarkup(room,floors)}
  </div>`;
}
function projectFloorBoardMarkup(floor,projectRoot,floors,currentFloorId){
  const active=currentFloorId===floor.id;
  const cards=(floor.rooms||[]).map(room=>projectRoomCardMarkup(room,projectRoot,floors)).join('')||'<div class="prop-tip">No rooms on this floor yet.</div>';
  return `<div class="project-floor-board${active?' active':''}">
    <div class="project-floor-head">
      <div>
        <div class="project-floor-title">${esc(floor.label||'Floor')}</div>
        <div class="project-floor-meta">${floor.rooms.length} room${floor.rooms.length===1?'':'s'}</div>
      </div>
      <div class="project-floor-actions">
        <button class="mini-chip secondary" type="button" data-action="set-active-floor" data-floor-id="${floor.id}">${active?'Viewing':'View Floor'}</button>
        <button class="mini-chip secondary" type="button" data-action="open-add-room-modal-for-project" data-floor-id="${floor.id}">Add Room</button>
      </div>
    </div>
    <div class="room-card-stack">${cards}</div>
  </div>`;
}
function renderRoomPanelNoSelection(r,{cBtn,activeLightingPreset,ref,refLoaded,refScale,refWidth,floors,currentFloorId,roomCards}){
  const currentFloor=floors.find(floor=>floor.id===currentFloorId)||floors[0];
  const floorSwitcher=`<div class="mat-grid tall">${floors.map(floor=>`<button class="mat-btn${currentFloorId===floor.id?' sel':''}" type="button" data-action="set-active-floor" data-floor-id="${floor.id}"><span class="mat-btn-title">${esc(floor.label)}</span><span class="mat-btn-meta">${floor.rooms.length} room${floor.rooms.length===1?'':'s'}</span></button>`).join('')}</div>`;
  const currentRoomTargets=floors.filter(floor=>floor.id!==(r.floorId||currentFloorId));
  const currentRoomMoveRow=currentRoomTargets.length
    ? `<label style="margin-top:8px">MOVE CURRENT ROOM TO</label><div class="room-floor-targets">${currentRoomTargets.map(floor=>`<button class="mini-chip secondary" type="button" data-action="move-current-room-to-floor" data-floor-id="${floor.id}">${esc(floor.label)}</button>`).join('')}</div>`
    : '';
  const floorBoards=floors.map(floor=>projectFloorBoardMarkup(floor,r,floors,currentFloorId)).join('');
  const homePlanSection=propSection('Home Plan',`<label>PROJECT NAME</label><input value="${esc(currentProjectName())}" data-action="rename-current-project"><label style="margin-top:8px">CURRENT ROOM</label><input value="${esc(r.name||'Room')}" data-action="rename-current-room"><div class="prop-state">Building <strong>${projectMainRooms(r).length} rooms</strong> across <strong>${floors.length} floor${floors.length===1?'':'s'}</strong>. Keep shaping the home here, then step into each room to furnish and present it.</div><label style="margin-top:8px">FLOORS</label>${floorSwitcher}<div class="quick-rotate-row"><button class="pbtn soft" type="button" data-action="open-add-room-modal-for-project" data-floor-id="${currentFloor?.id||currentFloorId}">Add Room Here</button><button class="pbtn soft" type="button" data-action="create-next-floor">Add Floor</button><button class="pbtn soft" type="button" data-action="duplicate-current-room">Duplicate Current</button></div><div class="quick-rotate-row"><button class="pbtn soft" type="button" data-action="move-current-room-order" data-direction="-1">Move Earlier</button><button class="pbtn soft" type="button" data-action="move-current-room-order" data-direction="1">Move Later</button><button class="pbtn soft" type="button" data-action="delete-current-room">Delete Current</button></div>${currentRoomMoveRow}<div class="prop-tip">The active floor stays in focus, but every room in the house is listed below so you can jump, duplicate, delete, or move rooms without losing your place.</div><div class="project-floor-stack">${floorBoards}</div>`);
  const surfacesSection=propSection('Surfaces',`<label>WALL STYLE</label><div class="mat-grid">${WALL_PALETTES.map(c=>`<button class="mat-btn${(r.materials.wallFinish||'warm_white')===c.id?' sel':''}" onclick="setWallFinish('${c.id}')" style="background:${c.color};color:${c.id==='charcoal_accent'?'#fff':'#332922'}">${c.name}</button>`).join('')}</div><div class="prop-state${wallColorIsCustom(r)?' custom':''}">${wallColorIsCustom(r)?`Custom wall color active <button class="prop-link-btn" onclick="resetWallColorToStyle()">Reset to style</button>`:'Wall color follows the selected wall style.'}</div><label style="margin-top:8px">CUSTOM WALL COLOR</label><div class="color-input-row"><input class="color-input" type="color" value="${colorInputValue(r.materials.wall,WALL_PALETTES[0].color)}" onchange="setWallPaint(this.value)"><span class="color-input-copy">Use any wall color, or tap a quick swatch below.</span></div><div class="paint-row">${WALL_PALETTES.map(c=>`<button class="swatch${r.materials.wall===c.color?' sel':''}" style="background:${c.color}" onclick="setWallPaint('${c.color}')" title="Use ${c.name} as a custom wall color"></button>`).join('')}</div><div class="prop-tip">Choose a style first, then use custom color only when you want a deliberate override.</div><label style="margin-top:8px">FLOOR STYLE</label><div class="mat-grid">${FLOOR_TYPES.map(ft=>`<button class="mat-btn${(r.materials.floorType||'light_oak')===ft.id?' sel':''}" onclick="setFloorType('${ft.id}')">${ft.name}</button>`).join('')}</div><div class="prop-state${floorColorIsCustom(r)?' custom':''}">${floorColorIsCustom(r)?`Custom floor color active <button class="prop-link-btn" onclick="resetFloorColorToStyle()">Reset to style</button>`:'Floor color follows the selected floor style.'}</div><label style="margin-top:8px">CUSTOM FLOOR COLOR</label><div class="color-input-row"><input class="color-input" type="color" value="${colorInputValue(r.materials.floor,FLOOR_TYPES[0].color)}" onchange="setFloorPaint(this.value)"><span class="color-input-copy">Keep the floor pattern, but tune the color more freely.</span></div><div class="paint-row">${FLOOR_TYPES.map(ft=>`<button class="swatch${r.materials.floor===ft.color?' sel':''}" style="background:${ft.color}" onclick="setFloorPaint('${ft.color}')" title="Use ${ft.name} as a custom floor color"></button>`).join('')}</div><div class="prop-tip">Floor style controls both the material family and the default finish tone.</div><label style="margin-top:8px">TRIM COLOR</label><div class="color-input-row"><input class="color-input" type="color" value="${colorInputValue(r.materials.trim,TRIM_COLORS[0])}" onchange="setTrimColor(this.value)"><span class="color-input-copy">Fine-tune trim while keeping quick trim swatches.</span></div><div class="paint-row">${TRIM_COLORS.map(c=>`<button class="swatch${r.materials.trim===c?' sel':''}" style="background:${c}" onclick="setTrimColor('${c}')"></button>`).join('')}</div>`);
  const connectionsSection=propSection('Add Room',`<div class="pr"><div><label>SHARED WALL (${distanceLabel()})</label><input type="number" step="${distanceInputStep(1)}" value="${distanceInputValue(adjRoomCfg.width)}" data-action="set-adj-room-width"></div><div><label>ROOM DEPTH (${distanceLabel()})</label><input type="number" step="${distanceInputStep(1)}" value="${distanceInputValue(adjRoomCfg.depth)}" data-action="set-adj-room-depth"></div></div><div class="mat-grid tall"><button class="mat-btn" type="button" data-action="attach-adjacent-room" data-side="north">Up</button><button class="mat-btn" type="button" data-action="attach-adjacent-room" data-side="east">Right</button><button class="mat-btn" type="button" data-action="attach-adjacent-room" data-side="south">Down</button><button class="mat-btn" type="button" data-action="attach-adjacent-room" data-side="west">Left</button></div><div class="prop-tip">Grow the layout one connected room at a time. Choose the side, and the new room will land on that edge with a doorway cut between them.</div>`);
  const lightingSection=propSection('Lighting Mood',`<label>LIGHTING MOOD</label><div class="mat-grid tall">${Object.entries(LIGHTING_PRESETS).map(([id,preset])=>`<button class="mat-btn${activeLightingPreset===id?' sel':''}" onclick="setLightingPreset('${id}')">${preset.name}</button>`).join('')}</div><div class="prop-state">Active mood: <strong>${LIGHTING_PRESETS[activeLightingPreset]?.name||'Daylight'}</strong></div><div class="prop-tip">${lightingPresetHelp(activeLightingPreset)}</div><label style="margin-top:8px">LIGHT CHARACTER</label><input type="range" min="0" max="1" step="0.05" value="${r.materials.lightCharacter??.5}" oninput="setLightCharacter(this.value)"><div class="prop-tip">Move from crisp daylight toward warmer evening or moodier blue-hour character.</div><div class="prop-state">${lightCharacterLabel(r)}</div><label style="margin-top:8px">CEILING BRIGHTNESS</label><input type="range" min="0.7" max="1.35" step="0.05" value="${r.materials.ceilingBrightness||1}" oninput="setCeilingBrightness(this.value)"><div class="prop-tip">Brightness only changes how much light the ceiling appears to bounce in 3D. It does not change room size.</div><div class="prop-state">${ceilingBrightnessLabel(r)}</div>${is3D?`<div class="quick-rotate-row" style="margin-top:8px"><button class="pbtn soft" onclick="togglePhotoMode()">${photoMode?'Exit Photo Mode':'Open Photo Mode'}</button><button class="pbtn soft" onclick="toggleWalkthroughTray()">Open Walkthroughs</button></div>`:''}`);
  const geometrySection=propSection('Ceiling Geometry',`<label>CEILING HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(r.height)}" onchange="uRoomHeight(this.value)"><div class="prop-tip">Height changes the room geometry, wall proportions, and how the 3D space feels. It is a structural room value, not a lighting effect.</div><div class="prop-tip">Closets live in the dedicated structural tool, not the furniture catalog.</div>`);
  const designDirectionSection=propSection('Design Direction',`<label>ROOM TYPE</label><div class="mat-grid">${ROOM_TYPES.map(type=>`<button class="mat-btn${(r.roomType||'living_room')===type.id?' sel':''}" onclick="setRoomType('${type.id}')">${type.name}</button>`).join('')}</div><div class="prop-tip">Room type tunes suggestions without changing your current furniture.</div><label style="margin-top:8px">STYLE PRESETS</label><div class="prop-state">Presets are optional design directions. They update finishes and lighting, so they sit behind a deliberate review step.</div><button class="pbtn soft" style="width:100%;margin-top:8px" onclick="toggleDesignPresetPanel()">${designPresetPanelOpen?'Hide Style Presets':'Review Style Presets'}</button>${designPresetPanelOpen?`<div class="mat-grid tall" style="margin-top:8px">${DESIGN_PRESETS.map(preset=>`<button class="mat-btn${(pendingDesignPresetId||r.designPreset||'')===preset.id?' sel':''}" onclick="selectPendingDesignPreset('${preset.id}')">${preset.name}</button>`).join('')}</div><div class="prop-tip">${(DESIGN_PRESETS.find(p=>p.id===(pendingDesignPresetId||r.designPreset))?.note)||'Choose a style direction to coordinate finishes, lighting, and mood.'}</div><button class="pbtn" style="width:100%;margin-top:8px" onclick="applyPendingDesignPreset()">Apply Selected Preset</button>`:''}`);
  const referenceSection=propSection('Tracing Reference',`${!refLoaded?`<div class="prop-tip">Import a floor plan image, PDF, or room photo, then trace your room geometry right on top of it in 2D.</div><button class="pbtn soft" style="width:100%;margin-top:8px" onclick="importReferenceAsset()">Import Image or PDF</button><div class="prop-tip">PDF pages render locally into the same tracing overlay, so calibration and editing work the same way.</div>`:`<div class="quick-rotate-row"><button class="pbtn soft" onclick="importReferenceAsset()">Replace ${ref.sourceType==='pdf'?'PDF / Image':'Image / PDF'}</button><button class="pbtn soft" onclick="toggleReferenceVisibility()">${ref.visible===false?'Show':'Hide'}</button><button class="pbtn soft" onclick="toggleReferenceLock()">${ref.locked?'Unlock':'Lock'}</button></div>${ref.sourceType==='pdf'&&ref.pdfPageCount>1?`<div class="quick-rotate-row"><button class="pbtn soft" onclick="setReferencePdfPage(${Math.max(1,(ref.pdfPage||1)-1)})"${(ref.pdfPage||1)<=1?' disabled':''}>Previous Page</button><button class="pbtn soft" onclick="setReferencePdfPage(${Math.min(ref.pdfPageCount||1,(ref.pdfPage||1)+1)})"${(ref.pdfPage||1)>=(ref.pdfPageCount||1)?' disabled':''}>Next Page</button></div><div class="prop-tip">PDF page ${(ref.pdfPage||1)} of ${ref.pdfPageCount||1}${ref.sourceName?` Ãƒâ€šÃ‚Â· ${esc(ref.sourceName)}`:''}</div>`:''}<div class="quick-rotate-row"><button class="pbtn soft" onclick="${ref.calibrationActive?'cancelReferenceCalibration()':'startReferenceCalibration()'}">${ref.calibrationActive?'Cancel Calibration':'Calibrate Scale'}</button><button class="pbtn soft" onclick="clearReferenceOverlay()">Remove</button></div><div class="prop-state">Reference: <strong>${ref.locked?'Locked':'Unlocked'}</strong> Ãƒâ€šÃ‚Â· ${ref.visible===false?'Hidden':'Visible'} Ãƒâ€šÃ‚Â· scale ${refScale}${refWidth?` Ãƒâ€šÃ‚Â· width ${refWidth}`:''}</div><div class="prop-tip">${referenceCalibrationStatus(ref)}</div><label style="margin-top:8px">OPACITY</label><input type="range" min="0.08" max="0.95" step="0.02" value="${ref.opacity||.56}" oninput="setReferenceOpacity(this.value)"><div class="pr"><div><label>CENTER X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(ref.centerX||0)}" onchange="setReferenceCenterAxis('centerX',this.value)"></div><div><label>CENTER Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(ref.centerY||0)}" onchange="setReferenceCenterAxis('centerY',this.value)"></div></div><label>REFERENCE SCALE</label><input type="range" min="0.25" max="4" step="0.05" value="${ref.scale||1}" oninput="setReferenceScale(this.value)">`}`);
  const redesignSection=propSection('Redesign Planning',`<div class="mat-grid tall"><button class="mat-btn${r.existingRoomMode?' sel':''}" onclick="toggleExistingRoomMode()">Existing Room Mode ${r.existingRoomMode?'On':'Off'}</button><button class="mat-btn${r.ghostExisting?' sel':''}" onclick="toggleGhostExisting()">Fade Existing Pieces ${r.ghostExisting?'On':'Off'}</button><button class="mat-btn${r.hideRemovedExisting?' sel':''}" onclick="toggleHideRemovedExisting()">Hide Removed ${r.hideRemovedExisting?'On':'Off'}</button><button class="mat-btn${r.showPlanLegend?' sel':''}" onclick="togglePlanLegend()">Legend ${r.showPlanLegend?'On':'Off'}</button></div><label style="margin-top:8px">WHAT TO SHOW IN PLAN</label><div class="mat-grid tall">${Object.entries(PLAN_VIEW_MODES).map(([mode,label])=>`<button class="mat-btn${currentPlanViewMode(r)===mode?' sel':''}" onclick="setPlanViewMode('${mode}')">${label}</button>`).join('')}</div><div class="prop-tip">${planViewMeaning(currentPlanViewMode(r))}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="setSelectedFurnitureSource('existing')">Mark Selected Existing</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Mark Selected New</button><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button></div><button class="pbtn soft" style="width:100%;margin-top:8px" onclick="exportComparisonSheet()">Export Before / After Story</button><div class="prop-tip">Use this when the real room is already furnished. Existing pieces get design tags so Rose can plan what stays, moves, gets replaced, or disappears.</div>`);
  const layerSection=propSection('Plan Layers',`<div class="mat-grid tall">${PLAN_LAYER_META.map(layer=>`<button class="mat-btn${roomLayerVisible(r,layer.id)?' sel':''}" onclick="toggleRoomLayer('${layer.id}')">${layer.label} ${roomLayerVisible(r,layer.id)?'On':'Off'}</button>`).join('')}</div><div class="prop-tip">Hide noisy parts of the plan while you trace, present, or focus on one pass of the redesign.</div>`);
  const optionsSection=propSection('Design Options',`<label>OPTION NAME</label><input value="${esc(r.optionName||'Main')}" onchange="renameCurrentOption(this.value)"><label style="margin-top:8px">STORY NOTES</label><textarea rows="4" onchange="setCurrentOptionNotes(this.value)" placeholder="What changes does this option explore?">${esc(r.optionNotes||'')}</textarea><div class="quick-rotate-row"><button class="pbtn soft" onclick="createRoomOptionFromCurrent()">Create New Option</button><button class="pbtn soft" onclick="exportComparisonSheet()">Export Before / After</button><button class="pbtn soft" onclick="exportDesignSummary()">Export Story Summary</button></div><div class="quick-rotate-row"><button class="pbtn soft" style="width:100%" onclick="exportPresentationPDF()">Export Presentation Deck</button></div><div class="mat-grid tall">${optionSiblings(r).sort((a,b)=>(a.optionName||'').localeCompare(b.optionName||'')).map(opt=>`<button class="mat-btn${opt.id===r.id?' sel':''}" onclick="switchToOption('${opt.id}')">${esc(opt.optionName||'Main')}</button>`).join('')}</div><div class="prop-tip">Options let you save alternate redesign directions for the same room without overwriting each other, then present each direction as its own story.</div>`);
  // Mood/Style Moves sections removed — handled by concrete material controls above.
  const editorSection=propSection('Editor Helpers',`<div class="mat-grid tall"><button class="mat-btn${furnitureSnap?' sel':''}" onclick="toggleFurnitureSnap()">Furniture Snap ${furnitureSnap?'On':'Off'}</button><button class="mat-btn${multiSelectMode?' sel':''}" onclick="toggleMultiSelectMode()">Multi-Select ${multiSelectMode?'On':'Off'}</button><button class="mat-btn" onclick="toggleUnitSystem()">Units: ${unitSystem==='metric'?'Metric':'Imperial'}</button>${furnitureClipboard?.items?.length?`<button class="mat-btn" onclick="pasteFurniture()">Paste ${furnitureClipboard.items.length>1?'Selection':'Furniture'}</button>`:''}</div><div class="prop-tip">Use Multi-Select to tap several furniture pieces on touch devices. Paste drops copied pieces near the center of the current view.</div>`);
  const furnishHintSection=propSection('Placing Furniture',`<div class="prop-tip">Tap any item in the catalog below to start placing it. Tap the room to drop it in place, or drag to reposition after placing. Select a piece to adjust size, rotation, mount, and finish.</div>${furnitureClipboard?.items?.length?`<div class="quick-rotate-row" style="margin-top:8px"><button class="pbtn soft" onclick="pasteFurniture()">Paste ${furnitureClipboard.items.length>1?`${furnitureClipboard.items.length} pieces`:'Furniture'}</button></div>`:''}`);
  const presentSection=propSection('Presentation',`<div class="quick-rotate-row"><button class="pbtn soft" onclick="exportPNG()">Export PNG</button><button class="pbtn soft" onclick="exportComparisonSheet()">Before / After</button><button class="pbtn soft" onclick="exportDesignSummary()">Story Summary</button></div><button class="pbtn soft" style="width:100%;margin-top:8px" onclick="exportPresentationPDF()">Export Presentation Deck</button>${is3D?`<div class="quick-rotate-row" style="margin-top:8px"><button class="pbtn soft" onclick="togglePhotoMode()">${photoMode?'Exit Photo Mode':'Open Photo Mode'}</button><button class="pbtn soft" onclick="toggleWalkthroughTray()">Walkthroughs</button></div><div class="prop-tip">Photo mode gives a full-screen render view. Walkthroughs create scripted camera tours you can export and share.</div>`:'<div class="prop-tip" style="margin-top:8px">Switch to 3D to access photo mode and walkthrough presentation tools.</div>'}`);
  let h=cBtn.replace('$T','Room Tools')+roomPanelTabs();
  if(roomPanelGroup==='build')h+=homePlanSection+connectionsSection+referenceSection+geometrySection+layerSection;
  if(roomPanelGroup==='style')h+=surfacesSection+lightingSection+designDirectionSection;
  if(roomPanelGroup==='furnish')h+=furnishHintSection+editorSection+layerSection+redesignSection;
  if(roomPanelGroup==='present')h+=optionsSection+presentSection;
  return h;
}

function showP(){
  const p=document.getElementById('propsP'),r=curRoom;
  const tab=document.getElementById('propsTab');
  if(!r){hideP();return}
  normalizeFurnitureSelection();
  updatePanelTabLabel();
  tab.classList.toggle('on',panelHidden);
  if(panelHidden){p.classList.remove('on');return}
  p.classList.toggle('peek',mobilePanelShouldPeek());
  let h='';
  const cBtn='<div class="props-hdr"><h4>$T</h4><button class="props-close" type="button" data-action="prop-close">\u00D7</button></div>';
  if(!sel.type||sel.idx<0){
    const activeLightingPreset=r.materials.lightingPreset||'daylight';
    const ref=r.referenceOverlay||normalizeReferenceOverlay({},r);
    const refLoaded=!!ref.src;
    const refBounds=typeof roomReferenceBounds==='function'?roomReferenceBounds(ref):null;
    const refScale=(ref.scale||1).toFixed(2);
    const refWidth=refBounds?formatDistance(refBounds.width,'friendly'):'';
    const floors=projectFloors(r);
    const currentFloorId=activeProjectFloorId||r.floorId||'floor_1';
    const floorRooms=currentFloorRooms(r,currentFloorId);
    const roomCards=floorRooms.map(room=>{
      const baseId=room.baseRoomId||room.id;
      const active=(curRoom.baseRoomId||curRoom.id)===baseId;
      const optionCount=optionSiblings(room).length;
      const connections=(room.connections||[]).filter(link=>projectRooms(r).some(candidate=>candidate.id===link.roomId));
      return `<div class="room-card-mini${active?' active':''}"><div class="room-card-main" onclick="openProjectRoom('${baseId}')"><div class="room-card-title">${esc(room.name)}</div><div class="room-card-meta">${esc(room.floorLabel||'Floor 1')}${optionCount>1?` Ãƒâ€šÃ‚Â· ${optionCount} options`:''}${connections.length?` Ãƒâ€šÃ‚Â· ${connections.length} connection${connections.length===1?'':'s'}`:''}</div></div><div class="room-card-actions"><button class="mini-chip secondary" type="button" onclick="openProjectRoom('${baseId}')">Open</button>${active?`<button class="mini-chip secondary" type="button" onclick="duplicateCurrentRoom()">Duplicate</button><button class="mini-chip secondary" type="button" onclick="deleteCurrentRoom()">Delete</button>`:''}</div></div>`;
    }).join('');
    p.innerHTML=renderRoomPanelNoSelection(r,{cBtn,activeLightingPreset,ref,refLoaded,refScale,refWidth,floors,currentFloorId,roomCards});
    restyleRoomPanelText(p);
    p.classList.add('on');
    return;
  }
  if(sel.type==='vertex'){const pt=r.polygon[sel.idx];h=cBtn.replace('$T','Vertex '+(sel.idx+1))+`<label>X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(pt.x)}" onchange="uV('x',this.value)"><label>Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(pt.y)}" onchange="uV('y',this.value)"><button class="pbtn dng" onclick="dV()">Delete</button>`}
  else if(sel.type==='opening'){const op=r.openings[sel.idx];h=cBtn.replace('$T',op.type==='door'?'Door':'Window')+`<label>OFFSET (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.offset)}" onchange="uO('offset',this.value)"><label>WIDTH (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.width)}" onchange="uO('width',this.value)">${op.type==='door'?`<label>SWING DIRECTION</label><select onchange="uO('swing',this.value)"><option value="in"${op.swing==='in'?' selected':''}>In</option><option value="out"${op.swing==='out'?' selected':''}>Out</option></select><label>HINGE SIDE</label><select onchange="uO('hinge',this.value)"><option value="left"${op.hinge==='left'?' selected':''}>Left</option><option value="right"${op.hinge==='right'?' selected':''}>Right</option></select>`:`<label>SILL HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.sillHeight||3)}" onchange="uO('sillHeight',this.value)"><label>HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.height||4)}" onchange="uO('height',this.value)"><div class="prop-tip">Drag this opening along any wall to reposition it.</div>`}<button class="pbtn dng" onclick="dO()">Delete</button>`}
  else if(sel.type==='structure'){const st=r.structures[sel.idx];if(st.rect)h=cBtn.replace('$T','Closet')+`<div class="pr"><div><label>X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.x)}" onchange="uS('x',this.value)"></div><div><label>Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.y)}" onchange="uS('y',this.value)"></div></div><div class="pr"><div><label>W (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.w)}" onchange="uS('w',this.value)"></div><div><label>D (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.h)}" onchange="uS('h',this.value)"></div></div><label>FINISH</label><select onchange="uS('finish',this.value)">${CLOSET_FINISHES.map(f=>`<option value="${f.id}"${st.finish===f.id?' selected':''}>${f.name}</option>`).join('')}</select><div class="prop-tip">Built-in styling now belongs to the selected closet.</div><button class="pbtn dng" onclick="dS()">Delete</button>`;else h=cBtn.replace('$T','Partition')+`<button class="pbtn dng" onclick="dS()">Delete</button>`}
  else if(sel.type==='annotation'){const note=r.textAnnotations[sel.idx];h=cBtn.replace('$T','Annotation')+`<label>TEXT</label><textarea rows="3" onchange="uA('text',this.value)">${esc(note.text||'')}</textarea><div class="pr"><div><label>X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.x)}" onchange="uA('x',this.value)"></div><div><label>Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.z)}" onchange="uA('z',this.value)"></div></div><div class="pr"><div><label>TEXT SIZE</label><input type="number" step="1" min="10" max="28" value="${note.fontSize||14}" onchange="uA('fontSize',this.value)"></div><div><label>COLOR</label><input class="color-input" type="color" value="${colorInputValue(note.color,'#8E6E6B')}" onchange="uA('color',this.value)"></div></div><button class="pbtn dng" onclick="dA()">Delete</button>`}
  else if(sel.type==='dim_annotation'){const note=r.dimensionAnnotations[sel.idx];h=cBtn.replace('$T','Dimension Note')+`<label>LABEL OVERRIDE</label><input value="${esc(note.label||'')}" placeholder="Auto length" onchange="uDA('label',this.value)"><div class="pr"><div><label>X1 (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.x1)}" onchange="uDA('x1',this.value)"></div><div><label>Y1 (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.z1)}" onchange="uDA('z1',this.value)"></div></div><div class="pr"><div><label>X2 (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.x2)}" onchange="uDA('x2',this.value)"></div><div><label>Y2 (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(note.z2)}" onchange="uDA('z2',this.value)"></div></div><div class="pr"><div><label>OFFSET</label><input type="number" step="0.1" min="0.3" max="2.5" value="${note.offset||.8}" onchange="uDA('offset',this.value)"></div><div><label>TEXT SIZE</label><input type="number" step="1" min="10" max="28" value="${note.fontSize||13}" onchange="uDA('fontSize',this.value)"></div></div><label>COLOR</label><input class="color-input" type="color" value="${colorInputValue(note.color,'#8E6E6B')}" onchange="uDA('color',this.value)"><button class="pbtn dng" onclick="dDA()">Delete</button>`}
  else if(sel.type==='furniture'){
    const records=selectedFurnitureRecords();
    if(records.length>1){
      const centroid=selectionCentroid(records);
      const existingCount=records.filter(item=>item.source==='existing').length;
      const multiVariantItem=selectedVariantController(records);
      const variantSection=multiVariantItem?`<label>STYLE VARIANT</label>${buildVariantSelector(multiVariantItem,getFurnitureVariant(records[0],multiVariantItem)?.id||getDefaultVariant(multiVariantItem)?.id||'','setSelectedFurnitureVariant','panel')}<div class="prop-tip">Apply one curated material direction across this selected set.</div>`:`<label>FINISH COLOR</label><div class="asset-color-grid"><button class="asset-color-chip" style="background:linear-gradient(135deg,#fff,#efe7db)" onclick="setFurnitureFinish('')"></button>${ASSET_FINISHES.map(c=>`<button class="asset-color-chip" style="background:${c}" onclick="setFurnitureFinish('${c}')"></button>`).join('')}</div>`;
      h=cBtn.replace('$T',`${records.length} Pieces Selected`)+`<div class="prop-tip">Tap more furniture while Multi-Select is on, then move the group together by dragging any selected piece.</div><div class="pr"><div><label>CENTER X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(centroid.x)}" disabled></div><div><label>CENTER Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(centroid.z)}" disabled></div></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="copySelectedFurniture()">Copy</button><button class="pbtn soft" onclick="duplicateSelectedFurniture()">Duplicate</button><button class="pbtn soft" onclick="pasteFurniture()">Paste</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="rotateSelectedFurniture(-15)">Rotate Left</button><button class="pbtn soft" onclick="turnAroundSelectedFurniture()">Turn Around</button><button class="pbtn soft" onclick="rotateSelectedFurniture(15)">Rotate Right</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="setSelectedFurnitureSource('existing')">Mark Existing</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Mark New</button><button class="pbtn soft" onclick="toggleSelectedFurnitureLock()">${records.every(item=>item.locked)?'Unlock':'Lock'}</button></div>${existingCount?`<label>PLAN ACTION</label><div class="mat-grid tall">${Object.entries(EXISTING_ACTIONS).map(([key,meta])=>`<button class="mat-btn" onclick="setSelectedRedesignAction('${key}')">${meta.label}</button>`).join('')}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair Replacement</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button></div>`:''}${variantSection}<button class="pbtn dng" onclick="dF()">Delete Selection</button>`;
    }else{
      const f=r.furniture[sel.idx];
      const variantItem=getFurnitureCatalogItem(f);
      const variant=getFurnitureVariant(f,variantItem);
      const pairText=f.source==='existing'
        ? (pairedReplacementFor(f,r)?.label?`Paired with: ${pairedReplacementFor(f,r).label}`:'No replacement paired yet.')
        : (linkedExistingFor(f,r)?.label?`Replaces: ${linkedExistingFor(f,r).label}`:'Not paired to an existing piece.');
      const finishSection=itemSupportsVariants(variantItem)
        ? `<label>STYLE VARIANT</label>${buildVariantSelector(variantItem,variant?.id||getDefaultVariant(variantItem)?.id||'','setSelectedFurnitureVariant','panel')}<div class="prop-tip">Switch the finish family without replacing the piece.</div>`
        : `<label>FINISH COLOR</label><div class="asset-color-grid"><button class="asset-color-chip${!f.finishColor?' sel':''}" style="background:linear-gradient(135deg,#fff,#efe7db)" onclick="setFurnitureFinish('')"></button>${ASSET_FINISHES.map(c=>`<button class="asset-color-chip${f.finishColor===c?' sel':''}" style="background:${c}" onclick="setFurnitureFinish('${c}')"></button>`).join('')}</div>`;
      h=cBtn.replace('$T',f.label||'Item')+`<label>LABEL</label><input value="${esc(f.label||'')}" onchange="uF('label',this.value)"><div class="pr"><div><label>W (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(f.w||2)}" onchange="uF('w',this.value)"></div><div><label>D (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(f.d||1.5)}" onchange="uF('d',this.value)"></div></div><label>ROTATION</label><input type="number" step="15" value="${f.rotation||0}" onchange="uF('rotation',this.value)"><div class="prop-tip">The little triangle in 2D shows the front of the piece.</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="copySelectedFurniture()">Copy</button><button class="pbtn soft" onclick="duplicateSelectedFurniture()">Duplicate</button><button class="pbtn soft" onclick="pasteFurniture()">Paste</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="rotateSelectedFurniture(-15)">Rotate Left</button><button class="pbtn soft" onclick="turnAroundSelectedFurniture()">Turn Around</button><button class="pbtn soft" onclick="rotateSelectedFurniture(15)">Rotate Right</button></div><label>MOUNT</label><select onchange="uF('mountType',this.value)"><option value="floor"${f.mountType==='floor'?' selected':''}>Floor</option><option value="wall"${f.mountType==='wall'?' selected':''}>Wall</option><option value="surface"${f.mountType==='surface'?' selected':''}>Surface</option><option value="ceiling"${f.mountType==='ceiling'?' selected':''}>Ceiling</option></select><label>ELEVATION (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(f.elevation||0)}" onchange="uF('elevation',this.value)"><label>ROOM ROLE</label><div class="mat-grid tall"><button class="mat-btn${f.source==='existing'?' sel':''}" onclick="setSelectedFurnitureSource('existing')">Existing Piece</button><button class="mat-btn${f.source!=='existing'?' sel':''}" onclick="setSelectedFurnitureSource('new')">New Piece</button><button class="mat-btn${f.locked?' sel':''}" onclick="toggleSelectedFurnitureLock()">${f.locked?'Locked':'Unlocked'}</button></div>${f.source==='existing'?`<label>PLAN ACTION</label><div class="mat-grid tall">${Object.entries(EXISTING_ACTIONS).map(([key,meta])=>`<button class="mat-btn${f.redesignAction===key?' sel':''}" onclick="setSelectedRedesignAction('${key}')">${meta.label}</button>`).join('')}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair Replacement</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button></div><div class="prop-tip">${pairText}</div>`:`<div class="quick-rotate-row"><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair To Existing</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Keep As New</button></div><div class="prop-tip">${pairText}</div>`}${finishSection}<button class="pbtn dng" onclick="dF()">Delete</button>`;
    }
  }
  p.innerHTML=h;p.classList.add('on')}
function hideP(){const panel=document.getElementById('propsP');panel.classList.remove('on','peek');updatePanelTabLabel();document.getElementById('propsTab').classList.toggle('on',panelHidden&&!!curRoom)}
function closeP(){panelHidden=true;hideP()}
function openP(){panelHidden=false;showP()}
function uV(k,v){curRoom.polygon[sel.idx][k]=parseDistanceInput(v,curRoom.polygon[sel.idx][k]);curRoom.walls=genWalls(curRoom);pushU();draw()}
function dV(){if(curRoom.polygon.length<=3){toast('Need at least 3');return}curRoom.polygon.splice(sel.idx,1);curRoom.walls=genWalls(curRoom);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP()}
function uO(k,v){const o=curRoom.openings[sel.idx];if(k==='swing'||k==='hinge')o[k]=v;else o[k]=parseDistanceInput(v,o[k]||0);clampOpeningToWall(o);pushU();draw();showP();scheduleRebuild3D()}
function dO(){curRoom.openings.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP();scheduleRebuild3D()}
function uS(k,v){const st=curRoom.structures[sel.idx];if(st.rect){if(k==='finish')st.finish=v;else st.rect[k]=parseDistanceInput(v,st.rect[k]||0)}pushU();draw();showP();scheduleRebuild3D()}
function dS(){curRoom.structures.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP();scheduleRebuild3D()}
function uA(k,v){
  const note=curRoom?.textAnnotations?.[sel.idx];
  if(!note)return;
  if(k==='text')note.text=String(v||'').trim()||'Note';
  else if(k==='color')note.color=v||'#8E6E6B';
  else if(k==='fontSize')note.fontSize=Math.max(10,Math.min(28,parseFloat(v)||14));
  else note[k]=parseDistanceInput(v,note[k]||0);
  pushU();draw();showP();
}
function dA(){curRoom.textAnnotations.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP()}
function uDA(k,v){
  const note=curRoom?.dimensionAnnotations?.[sel.idx];
  if(!note)return;
  if(k==='label')note.label=String(v||'').trim();
  else if(k==='color')note.color=v||'#8E6E6B';
  else if(k==='fontSize')note.fontSize=Math.max(10,Math.min(28,parseFloat(v)||13));
  else if(k==='offset')note.offset=Math.max(.3,Math.min(2.5,parseFloat(v)||.8));
  else note[k]=parseDistanceInput(v,note[k]||0);
  pushU();draw();showP();
}
function dDA(){curRoom.dimensionAnnotations.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP()}
function uF(k,v){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(f=>{
    if(k==='label'){f[k]=v}
    else if(k==='mountType'){f[k]=v;if(v==='wall'&&(!f.elevation||f.elevation<2))f.elevation=defaultElevation(v,f.assetKey,resolveLabel(f.label))}
    else if(k==='rotation')f[k]=parseFloat(v)||0;
    else f[k]=parseDistanceInput(v,f[k]||0);
  });
  pushU();draw();showP();scheduleRebuild3D()
}
function dF(){deleteSelectedFurniture()}
