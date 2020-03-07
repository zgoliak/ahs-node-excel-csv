const config = {
	LOGS : [],//'verbose','global','rules'
	REPORT : {
		SOQL :'SELECT Disney__c,Ancillary_Specialty__c,Company_Type__c,Board_Speciality_P__c,NPI__c,GroupName__c,First_Name__c,Middle_Name__c,Last_Name__c,Title__c,Primary_Specialty__c,Phone1__c,PhysicalAddressStreet1a__c,PhysicalAddressStreet1b__c,PhysicalAddressCity1__c,PhysicalAddressState1__c,PhysicalAddressPostalCode1__c,PECOS__c,Gender__c,Primary_Language__c,Medical_Education__c,Professional_Education__c,Graduate_Education__c,Tax_ID__c,OtherStreet__c,OtherCity__c,OtherState__c,OtherPostalCode__c,Billing_Phone__c,Accepting_New_Patients__c,Board_Certified_P__c FROM PHSO_Reporting__c WHERE PhysicalAddressStreet1a__c != null AND NPI__c != null AND Tax_ID__c != null LIMIT 20',
		FILENAME : 'Disney_FHPNProviderDirectoryFile_',
		BOOKTYPE : 'xlsx',
		RULES : [{action : 'update', field : 'attributes', column : 'ProviderCIN'},
			{action : 'replace', field : 'ProviderCIN', operator : 'equals', value : '[\d]+', replace : 'Florida Hospital Physician Network'},
			{action : 'update', field : 'Disney__c', column : 'CINParticipation'},
			{action : 'update', field : 'Ancillary_Specialty__c', column : 'UniqueProviderID'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Ambulance', replace : '001'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Ambulatory Surgery Center', replace : '002'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Audiology', replace : '003'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Birthing Center', replace : '004'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Cardiac Diagnostic Tesing', replace : '005'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Diabetes - Outpatient Mngt/Training', replace : '006'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Diagnostic Testing', replace : '007'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Dialysis Center', replace : '008'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Durable Medical Equipment', replace : '009'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Emergency Department', replace : '010'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Emergency Medicine', replace : '011'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Gamma Knife', replace : '012'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Home Health', replace : '013'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Home Infusion', replace : '014'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Hospice', replace : '015'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Hospital', replace : '016'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Hospitalist Group (Critical Care)', replace : '017'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Hospital-LTAC (Long Term Acute Care)', replace : '018'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Interventional Pain Medicine', replace : '019'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Laboratory', replace : '020'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Lithotripsy', replace : '021'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Mental Health Center', replace : '022'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Multi-Specialty', replace : '023'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Organ Transplant', replace : '024'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Outpatient Surgery', replace : '025'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Pathology Anatomic and Clinical', replace : '026'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Perinatal Home Health', replace : '027'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Prosthetic & Orthotic', replace : '028'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Radiology', replace : '029'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Rehab Facility-Outpatient', replace : '030'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Rehabilitation', replace : '031'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Rehabilitation-Inpatient', replace : '032'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Skilled Nursing Facility', replace : '033'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Sleep Medicine', replace : '034'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Undersea and Hyperbaric Medicine', replace : '035'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Urgent Care', replace : '036'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Vascular and Interventional Radiology', replace : '037'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Walk-in Clinic', replace : '038'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Women\'s Medicine', replace : '039'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Wound Care', replace : '040'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Oncology', replace : '041'},
			{action : 'replace', field : 'UniqueProviderID', operator : 'equals', value : 'Anesthesia', replace : '042'},
			{action : 'concat', field : 'UniqueProviderID', concat : 'ProviderNPI,-,ProviderAddress1,-,BillingTaxID'},
			{action : 'format', field : 'UniqueProviderID', format : 'uniqueproviderid'},
			{action : 'update', field : 'Company_Type__c', column : 'ProviderType'},
			{action : 'replace', field : 'ProviderType', operator : 'equals', value : 'Physician Group', replace : 'Facility'},
			{action : 'replace', field : 'ProviderType', operator : 'equals', value : '', replace : 'Physician'},
			{action : 'update', field : 'Board_Speciality_P__c', column : 'ProviderRole'},
			{action : 'replace', field : 'ProviderRole', operator : 'equals', value : 'Family Practice', replace : 'PCP'},
			{action : 'replace', field : 'ProviderRole', operator : 'equals', value : '', replace : 'SCP'},
			{action : 'replace', field : 'ProviderRole', operator : 'equals', value : '', replace : 'Hosp'},
			{action : 'update', field : 'NPI__c', column : 'ProviderNPI'},
			{action : 'update', field : 'GroupName__c', column : 'Facility Name'},
			{action : 'update', field : 'First_Name__c', column : 'PhysicianFirstName'},
			{action : 'update', field : 'Middle_Name__c', column : 'PhysicianMiddleName'},
			{action : 'update', field : 'Last_Name__c', column : 'PhysicianLastName'},
			{action : 'update', field : 'Title__c', column : 'PhysicianTitle'},
			{action : 'update', field : 'Primary_Specialty__c', column : 'PrimarySpecialty'},
			{action : 'update', field : 'Phone1__c', column : 'ProviderPhone'},
			{action : 'format', field : 'ProviderPhone', format : 'phone'},
			{action : 'update', field : 'PhysicalAddressStreet1a__c', column : 'ProviderAddress1'},
			{action : 'update', field : 'PhysicalAddressStreet1b__c', column : 'ProviderAddress2'},
			{action : 'update', field : 'PhysicalAddressCity1__c', column : 'ProviderCity'},
			{action : 'update', field : 'PhysicalAddressState1__c', column : 'ProviderState'},
			{action : 'update', field : 'PhysicalAddressPostalCode1__c', column : 'ProviderZip'},
			{action : 'update', field : 'PECOS__c', column : 'PhysicianGroup'},
			{action : 'prepend', field : 'Gender__c', column : 'PracticeName'},
			{action : 'copy', field : 'PracticeName', source : 'Facility Name'},
			{action : 'update', field : 'Gender__c', column : 'ProviderGender'},
			{action : 'replace', field : 'ProviderGender', operator : 'equals', value : 'Female', replace : 'F'},
			{action : 'replace', field : 'ProviderGender', operator : 'equals', value : 'Male', replace : 'M'},
			{action : 'update', field : 'Primary_Language__c', column : 'ProviderLang'},
			{action : 'update', field : 'Medical_Education__c', column : 'ProviderSchoolNm1'},
			{action : 'prepend', field : 'Professional_Education__c', column : 'ProviderSchoolGrad1'},
			{action : 'update', field : 'Professional_Education__c', column : 'ProviderSchoolNm2'},
			{action : 'prepend', field : 'Graduate_Education__c', column : 'ProviderSchoolGrad2'},
			{action : 'update', field : 'Graduate_Education__c', column : 'ProviderSchoolNm3'},
			{action : 'prepend', field : 'Tax_ID__c', column : 'ProviderSchoolGrad3'},
			{action : 'prepend', field : 'Tax_ID__c', column : 'ProviderLatitude'},
			{action : 'prepend', field : 'Tax_ID__c', column : 'ProviderLongitude'},
			{action : 'prepend', field : 'Tax_ID__c', column : 'ProviderAddrSeq'},
			{action : 'update', field : 'Tax_ID__c', column : 'BillingTaxID'},
			{action : 'update', field : 'OtherStreet__c', column : 'BillingAddress1'},
			{action : 'update', field : 'OtherCity__c', column : 'BillingCity'},
			{action : 'update', field : 'OtherState__c', column : 'BillingState'},
			{action : 'update', field : 'OtherPostalCode__c', column : 'BillingZip'},
			{action : 'update', field : 'Billing_Phone__c', column : 'BillingPhone'},
			{action : 'format', field : 'BillingPhone', format : 'phone'},
			{action : 'update', field : 'Accepting_New_Patients__c', column : 'NewPatientStatus'},
			{action : 'prepend', field : 'Board_Certified_P__c', column : 'PPONumber'},
			{action : 'prepend', field : 'Board_Certified_P__c', column : 'CentralizedPmt'},
			{action : 'markdupe', field : 'CentralizedPmt', duplicate : 'BillingTaxID', value : 'X'},
			{action : 'prepend', field : 'Board_Certified_P__c', column : 'FeeSchedule'},
			{action : 'update', field : 'Board_Certified_P__c', column : 'BoardCertified'}]
		}
	}

module.exports = config
