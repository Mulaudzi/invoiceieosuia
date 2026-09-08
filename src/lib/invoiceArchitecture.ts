export const documentTypes = [
  { id: 'standard_invoice', name: 'Standard Invoice' }, { id: 'tax_invoice', name: 'Tax Invoice' },
  { id: 'pro_forma', name: 'Pro Forma Invoice' }, { id: 'commercial', name: 'Commercial Invoice' },
  { id: 'interim', name: 'Interim Invoice' }, { id: 'final', name: 'Final Invoice' },
  { id: 'recurring', name: 'Recurring Invoice' }, { id: 'deposit', name: 'Deposit Invoice' },
  { id: 'progress', name: 'Progress Invoice' }, { id: 'quote', name: 'Quote / Estimate' },
  { id: 'credit_note', name: 'Credit Note' }, { id: 'debit_note', name: 'Debit Note' },
  { id: 'receipt', name: 'Receipt' },
] as const;

export type DocumentTypeId = typeof documentTypes[number]['id'];
export const getDocumentTitle = (id: string): string => ({
  standard_invoice:'INVOICE', tax_invoice:'TAX INVOICE', pro_forma:'PRO FORMA INVOICE', commercial:'COMMERCIAL INVOICE',
  interim:'INTERIM INVOICE', final:'FINAL INVOICE', recurring:'RECURRING INVOICE', deposit:'DEPOSIT INVOICE',
  progress:'PROGRESS INVOICE', quote:'QUOTE / ESTIMATE', credit_note:'CREDIT NOTE', debit_note:'DEBIT NOTE', receipt:'RECEIPT',
}[id] || 'INVOICE');
export type InvoiceFieldType = 'text' | 'date' | 'number';
export interface CategoryField { key: string; label: string; type?: InvoiceFieldType; placeholder?: string }
export interface LineColumn { key: 'group' | 'sku' | 'name' | 'quantity' | 'unit' | 'price' | 'discount' | 'tax'; label: string }
export interface InvoiceCategory {
  id: string; name: string; shortName: string; description: string; icon: string; popular?: boolean;
  templateCount: number; documentTypes: DocumentTypeId[]; fields: CategoryField[]; columns: LineColumn[];
  groups?: string[]; industries: string[];
}

const commonDocs: DocumentTypeId[] = ['standard_invoice', 'tax_invoice', 'pro_forma', 'final', 'quote', 'credit_note', 'debit_note', 'receipt'];
const field = (key: string, label: string, type: InvoiceFieldType = 'text'): CategoryField => ({ key, label, type });
const columns = (name = 'Description', qty = 'Qty', rate = 'Rate'): LineColumn[] => [
  { key: 'name', label: name }, { key: 'quantity', label: qty }, { key: 'price', label: rate },
  { key: 'discount', label: 'Discount %' }, { key: 'tax', label: 'Tax %' },
];

export const invoiceCategories: InvoiceCategory[] = [
  { id:'general', name:'General / Standard', shortName:'General', description:'Everyday professional business invoices', icon:'FileText', popular:true, templateCount:10, documentTypes:commonDocs, fields:[], columns:columns(), industries:['Business','Retail'] },
  { id:'services', name:'Service Invoice', shortName:'Services', description:'Hours, labour and fixed-price services', icon:'Briefcase', popular:true, templateCount:8, documentTypes:commonDocs, fields:[field('projectName','Project name'),field('billingMethod','Billing method')], columns:columns('Service','Hours','Hourly rate'), groups:['Services','Expenses'], industries:['Services','IT','Marketing'] },
  { id:'products', name:'Product / Sales', shortName:'Products', description:'Retail, wholesale and physical goods', icon:'Package', popular:true, templateCount:8, documentTypes:[...commonDocs,'commercial'], fields:[field('orderNumber','Order number')], columns:[{key:'sku',label:'SKU'},...columns('Product','Qty','Unit price'),{key:'unit',label:'Unit'}], industries:['Retail','E-commerce','Distribution'] },
  { id:'freelancer', name:'Freelancer', shortName:'Freelancer', description:'Creative and independent professionals', icon:'Palette', templateCount:8, documentTypes:commonDocs, fields:[field('projectName','Project name'),field('projectDescription','Project description'),field('milestone','Milestone'),field('deliverable','Deliverable')], columns:columns('Deliverable','Hours','Rate'), groups:['Work','Expenses'], industries:['Freelance','Design','Development'] },
  { id:'construction', name:'Contractor / Construction', shortName:'Construction', description:'Jobs, sites, materials and progress billing', icon:'Building2', templateCount:8, documentTypes:[...commonDocs,'deposit','progress','interim'], fields:[field('jobNumber','Job number'),field('siteName','Project / site name'),field('siteAddress','Site address'),field('completionPercentage','Completion %','number'),field('retention','Retention %','number'),field('depositPaid','Deposit paid','number')], columns:[{key:'group',label:'Type'},...columns(),{key:'unit',label:'Unit'}], groups:['Labour','Materials','Equipment','Transport','Other'], industries:['Construction','Trades'] },
  { id:'repair', name:'Repair / Maintenance', shortName:'Repair', description:'Labour, parts and maintenance work', icon:'Settings', templateCount:6, documentTypes:commonDocs, fields:[field('jobNumber','Job / repair number'),field('item','Device / vehicle / item'),field('serialNumber','Serial number'),field('registration','Registration number'),field('technician','Technician'),field('workPerformed','Work performed'),field('warranty','Warranty information')], columns:[{key:'group',label:'Type'},...columns('Part / Labour')], groups:['Labour','Parts','Other costs'], industries:['Repair','Maintenance'] },
  { id:'rental', name:'Rental', shortName:'Rental', description:'Property, vehicle and equipment rental', icon:'Home', templateCount:6, documentTypes:[...commonDocs,'deposit'], fields:[field('rentalItem','Rental item / property'),field('rentalStart','Rental start','date'),field('rentalEnd','Rental end','date'),field('deposit','Deposit','number'),field('damageCharges','Damage charges','number'),field('lateCharges','Late charges','number')], columns:columns('Rental item','Duration','Period rate'), groups:['Rental','Additional charges'], industries:['Property','Equipment','Vehicle Rental'] },
  { id:'transport', name:'Transport / Logistics', shortName:'Transport', description:'Delivery, courier, trucking and moving', icon:'MapPin', templateCount:6, documentTypes:[...commonDocs,'commercial'], fields:[field('pickupLocation','Pickup location'),field('deliveryLocation','Delivery location'),field('distance','Distance'),field('vehicle','Vehicle'),field('driver','Driver'),field('trackingNumber','Tracking / reference'),field('weight','Weight')], columns:columns('Delivery / service','Qty','Fee'), groups:['Delivery','Fuel surcharge','Other'], industries:['Logistics','Courier','Moving'] },
  { id:'hospitality', name:'Hospitality', shortName:'Hospitality', description:'Accommodation, catering, venues and events', icon:'Star', templateCount:6, documentTypes:[...commonDocs,'deposit'], fields:[field('bookingNumber','Booking number'),field('checkIn','Check-in','date'),field('checkOut','Check-out','date'),field('eventDate','Event date','date'),field('venue','Venue'),field('guestCount','Number of guests','number')], columns:columns('Room / package / service','Nights / Qty','Rate'), groups:['Accommodation','Food & services','Additional charges'], industries:['Hotel','Catering','Events'] },
  { id:'professional', name:'Professional / Consulting', shortName:'Professional', description:'Practices, agencies and consultants', icon:'Briefcase', templateCount:6, documentTypes:[...commonDocs,'interim'], fields:[field('referenceNumber','Matter / project reference'),field('professional','Professional / provider')], columns:columns('Professional service','Hours','Rate'), groups:['Professional fees','Disbursements','Expenses'], industries:['Legal','Accounting','Consulting'] },
  { id:'medical', name:'Medical / Healthcare', shortName:'Healthcare', description:'Privacy-conscious healthcare billing', icon:'Shield', templateCount:6, documentTypes:['standard_invoice','tax_invoice','final','receipt','credit_note'], fields:[field('patientName','Patient / customer'),field('provider','Provider'),field('serviceDate','Service date','date'),field('insuranceContribution','Medical aid / insurance contribution','number')], columns:columns('Service / procedure','Qty','Rate'), groups:['Services','Patient responsibility'], industries:['Healthcare','Dental','Therapy'] },
  { id:'education', name:'Education / Training', shortName:'Education', description:'Schools, courses, tutors and workshops', icon:'BookOpen', templateCount:6, documentTypes:[...commonDocs,'deposit'], fields:[field('studentName','Student / learner'),field('course','Course / programme'),field('term','Term / session')], columns:columns('Tuition / item','Qty','Fee'), groups:['Tuition','Registration','Materials','Additional charges'], industries:['Education','Training'] },
  { id:'recurring', name:'Subscription / Recurring', shortName:'Recurring', description:'Subscriptions, memberships and retainers', icon:'RefreshCw', templateCount:6, documentTypes:['recurring','standard_invoice','tax_invoice','receipt'], fields:[field('billingPeriod','Billing period'),field('subscriptionStart','Start date','date'),field('subscriptionEnd','End date','date'),field('billingFrequency','Billing frequency'),field('previousBalance','Previous balance','number')], columns:columns('Subscription / service','Qty','Rate'), groups:['Subscription','Usage','Previous balance'], industries:['SaaS','Membership','Retainer'] },
  { id:'wholesale', name:'Wholesale / Bulk', shortName:'Wholesale', description:'Dense layouts for bulk orders', icon:'Grid', templateCount:6, documentTypes:[...commonDocs,'commercial'], fields:[field('orderNumber','Purchase order number')], columns:[{key:'sku',label:'SKU'},...columns('Product','Units','Unit price'),{key:'unit',label:'Packs / cartons'}], groups:['Products'], industries:['Wholesale','Distribution'] },
  { id:'creative', name:'Creative / Media', shortName:'Creative', description:'Production, licensing and deliverables', icon:'Camera', templateCount:6, documentTypes:[...commonDocs,'deposit','progress'], fields:[field('projectName','Project'),field('shootDate','Shoot / event date','date'),field('deliverables','Deliverables'),field('licensing','Licensing')], columns:[{key:'group',label:'Type'},...columns('Production item','Qty / Hours','Rate')], groups:['Production','Editing','Equipment','Travel','Licensing'], industries:['Photography','Video','Media'] },
  { id:'automotive', name:'Automotive', shortName:'Automotive', description:'Vehicles, labour, parts and workshop charges', icon:'Settings', templateCount:6, documentTypes:commonDocs, fields:[field('vehicle','Vehicle'),field('vehicleMake','Make'),field('vehicleModel','Model'),field('registration','Registration'),field('vin','VIN'),field('mileage','Mileage','number')], columns:[{key:'group',label:'Type'},...columns('Part / Labour')], groups:['Labour','Parts','Other charges'], industries:['Mechanic','Dealership','Auto Services'] },
];

export type InvoiceCategoryId = typeof invoiceCategories[number]['id'];
export interface InvoiceTemplateDefinition {
  id:string; name:string; slug:string; category:string; supportedDocumentTypes:DocumentTypeId[]; description:string;
  layout:'classic'|'modern'|'compact'|'editorial'; styleVariant:string; colorScheme:string; fontStyle:string;
  density:'comfortable'|'compact'; supportsLogo:boolean; supportsSignature:boolean; supportsImages:boolean;
  supportsBankDetails:boolean; supportsQRPayment:boolean; supportsTax:boolean; supportsDiscount:boolean;
  supportsCustomFields:boolean; supportsGroupedItems:boolean; status:'active'|'comingSoon'; version:number;
  industry:string[]; popular:boolean; recommended:boolean; free:boolean; featured:boolean;
}

const styles = [
  ['Classic','classic','navy','serif'], ['Modern','modern','blue','sans'], ['Minimal','modern','slate','sans'],
  ['Corporate','classic','indigo','sans'], ['Bold','editorial','emerald','sans'], ['Elegant','editorial','plum','serif'],
  ['Compact','compact','charcoal','sans'], ['Premium','modern','teal','serif'],
] as const;

const generalTemplates = [
  ['01','Corporate Blue','general-corporate-blue','classic','corporate-blue','blue','sans','The default professional IEOSUIA invoice.'],
  ['02','Teal Modern','general-teal-modern','modern','teal-modern','teal','sans','A lightweight contemporary teal design.'],
  ['03','Minimal Monochrome','general-minimal-monochrome','editorial','minimal-monochrome','monochrome','sans','Premium monochrome editorial layout.'],
  ['04','Executive Navy & Gold','general-executive-navy-gold','editorial','executive-navy-gold','navy-gold','serif','Dark executive design with gold highlights.'],
  ['05','Blue Wave','general-blue-wave','modern','blue-wave','blue','sans','Expressive corporate design with scalable wave decoration.'],
  ['06','Purple Clean','general-purple-clean','modern','purple-clean','purple','sans','Restrained purple corporate layout.'],
  ['07','Olive Corporate','general-olive-corporate','classic','olive-corporate','olive','serif','Traditional olive business design with modern spacing.'],
  ['08','Orange Creative','general-orange-creative','modern','orange-creative','orange','sans','Energetic layout for agencies and creative businesses.'],
  ['09','Red Professional','general-red-professional','classic','red-professional','red','sans','Confident professional layout with controlled red accents.'],
  ['10','Warm Minimal','general-warm-minimal','editorial','warm-minimal','warm-black','sans','Spacious warm editorial invoice with geometric details.'],
] as const;

const generalTemplateDefinitions: InvoiceTemplateDefinition[] = generalTemplates.map(([number,name,slug,layout,variant,colour,font,description],index) => ({
  id:`general-${number}`, name, slug, category:'general', supportedDocumentTypes:commonDocs,
  description, layout, styleVariant:variant, colorScheme:colour, fontStyle:font, density:'comfortable', supportsLogo:true,
  supportsSignature:true, supportsImages:false, supportsBankDetails:true, supportsQRPayment:false, supportsTax:true,
  supportsDiscount:true, supportsCustomFields:true, supportsGroupedItems:false, status:'active', version:1,
  industry:['Business','Professional services'], popular:index < 2, recommended:index < 3, free:true, featured:index === 0,
}));

export const invoiceTemplateRegistry: InvoiceTemplateDefinition[] = [...generalTemplateDefinitions, ...invoiceCategories.filter(category => category.id !== 'general').flatMap(category =>
  styles.slice(0, 1).map(([style, layout, colour, font], index): InvoiceTemplateDefinition => ({
    id:`${category.id}-${index + 1}`, name:`${category.shortName} Adaptive`, slug:`${category.id}-${style.toLowerCase()}`,
    category:category.id, supportedDocumentTypes:category.documentTypes, description:`A configurable layout designed for ${category.description.toLowerCase()}.`,
    layout, styleVariant:style.toLowerCase(), colorScheme:colour, fontStyle:font, density:style === 'Compact' ? 'compact' : 'comfortable',
    supportsLogo:true, supportsSignature:true, supportsImages:category.id === 'products', supportsBankDetails:true,
    supportsQRPayment:false, supportsTax:true, supportsDiscount:true, supportsCustomFields:true,
    supportsGroupedItems:Boolean(category.groups), status:'active', version:1, industry:category.industries,
    popular:index === 0, recommended:index < 2, free:true, featured:index === 1,
  })))];

export const getCategory = (id?: string) => invoiceCategories.find(category => category.id === id) ?? invoiceCategories[0];
const legacyTemplateAliases:Record<string,string> = {
  'general-classic':'general-corporate-blue','general-modern':'general-teal-modern','general-minimal':'general-minimal-monochrome',
  'general-corporate':'general-corporate-blue','general-bold':'general-orange-creative','general-elegant':'general-purple-clean',
  'general-compact':'general-warm-minimal','general-premium':'general-executive-navy-gold',
};
export const getTemplate = (slug?: string) => invoiceTemplateRegistry.find(template => template.slug === (legacyTemplateAliases[slug || ''] || slug)) ?? invoiceTemplateRegistry[0];
export const templateCount = invoiceTemplateRegistry.length;
