import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubPageHeader } from '@/components/vehicle/details/SubPageHeader';
import { useDetailsPalette, DetailsPalette } from '@/components/vehicle/details/detailsPalette';

// "Policy Agreements" page, from the Figma frame. Opened from the car details page
// (Policy Agreement → Learn More, Cancellation & Policy → View Terms & Condition).


type Point = string | { text: string; sub: string[] };
type Clause = { title: string; points: Point[]; note?: string };
export type PolicyKey = 'terms' | 'privacy' | 'cancellation' | 'consent' | 'grievance';
type Policy = { key: PolicyKey; title: string; clauses: Clause[] };

const TERMS_CLAUSES: Clause[] = [
  {
    title: 'Company Information',
    points: [
      'MySawari is operated by Yumly Lifestyle (OPC) Private Limited.',
      'Registered address: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
      'Website: https://www.mysawari.in',
      'Customer support email: hello@mysawari.in.',
      'These terms apply to the use of the MySawari application, website, and vehicle rental services.',
    ],
  },
  {
    title: 'Eligibility and Verification',
    points: [
      'The renter must meet the minimum age requirement applicable to the selected rental. The published website terms specify a minimum age of 21 years.',
      'The renter must hold a valid, unexpired driving licence appropriate for the vehicle.',
      'A government-issued identity document and driving licence may be required before vehicle handover.',
      'The name and other details provided during booking must match the submitted documents.',
      'MySawari may verify submitted information and refuse vehicle handover if mandatory documents are missing, invalid, or cannot be verified.',
      'The renter must provide accurate contact, address, and booking information.',
    ],
    note: 'The minimum rental age must be confirmed and made consistent across the website, app, and booking process before publication.',
  },
  {
    title: 'Booking and Payment',
    points: [
      'Bookings may be made through the MySawari website or supported application features.',
      'A booking is confirmed when the applicable booking and payment requirements have been satisfied and confirmation has been issued.',
      'Rental prices, package inclusions, applicable charges, and payment requirements will be displayed or communicated during booking.',
      'Accepted payment methods may include supported cards, UPI, and other payment methods displayed at checkout.',
      'Booking changes are subject to vehicle availability and any applicable charges disclosed before confirmation.',
      'Customers must not share their OTP, UPI PIN, CVV, banking password, or other payment authentication secrets.',
    ],
  },
  {
    title: 'Vehicle Handover and Return',
    points: [
      'The vehicle will be provided in a roadworthy condition, subject to the applicable inspection and handover process.',
      'The renter should inspect the vehicle and report visible damage before starting the trip.',
      'Pickup and return must take place at the agreed location and time.',
      'The renter is responsible for the vehicle during the rental period, subject to applicable law and the agreed rental terms.',
      'The vehicle must be returned in substantially the same condition, allowing for reasonable wear and tear.',
      'Any extension must be requested before the rental period ends and is subject to availability and approval.',
    ],
  },
  {
    title: 'Rental Duration and Kilometres',
    points: [
      {
        text: 'Standard Rental Package',
        sub: [
          'The rental period is the period confirmed in the booking.',
          'Included distance: 300 km, subject to the package displayed at booking.',
          'Additional distance: ₹75 per kilometre, or another rate explicitly displayed and accepted during booking.',
        ],
      },
      {
        text: 'Unlimited KM Package',
        sub: [
          'Unlimited kilometres apply only if this package is selected and confirmed in the booking.',
          'The package applies only during the booked rental period and remains subject to the other rental conditions.',
        ],
      },
      'Additional distance may be calculated using the recorded starting and ending odometer readings.',
      'Applicable additional kilometre charges must be settled in accordance with the booking terms.',
    ],
    note: 'The package and price shown in the confirmed booking determine the applicable kilometre allowance and charges.',
  },
  {
    title: 'Fuel and Vehicle Use',
    points: [
      'Fuel is not included unless expressly stated in the booking.',
      'The renter is responsible for fuel consumed during the rental.',
      'The vehicle should be returned with the agreed fuel level.',
      'Applicable refuelling charges may be recovered where the vehicle is returned with less fuel than agreed.',
      'Only the fuel type recommended for the vehicle may be used.',
      'Vehicles must not be used for unlawful activities, unauthorised subleasing, or purposes prohibited by the rental agreement.',
      'The renter must comply with applicable traffic laws, parking requirements, and geographic restrictions communicated for the booking.',
    ],
  },
  {
    title: 'Additional Drivers',
    points: [
      'Only the renter and additional drivers approved and registered with MySawari may drive the vehicle.',
      'Additional drivers must satisfy the applicable age, driving licence, and verification requirements.',
      'The renter must ensure that every permitted driver follows the applicable rental conditions.',
    ],
  },
  {
    title: 'Insurance, Damage and Liability',
    points: [
      'The insurance coverage applicable to the rental will be communicated through the booking or rental documentation.',
      'Customers should review the coverage, exclusions, deductibles, and applicable conditions before accepting the rental.',
      'The renter must promptly report accidents, damage, theft, or mechanical issues through the designated support channel.',
      'Responsibility for damage, loss, fines, or other charges will be determined by the rental agreement, applicable insurance terms, and applicable law.',
      'Roadside assistance, where included or offered, is subject to the applicable service conditions.',
    ],
    note: 'Do not describe a particular insurance limit, deductible, or exclusion unless it is supported by the actual insurance arrangement.',
  },
  {
    title: 'Customer Responsibilities',
    points: [
      'The renter must keep account, contact, and booking information accurate.',
      'The renter must take reasonable care of the vehicle and its keys and accessories.',
      'The renter must report safety concerns, mechanical faults, and incidents promptly.',
      'The renter must not permit an unauthorised person to use the vehicle.',
      'The renter must settle applicable rental charges in accordance with the confirmed booking and applicable policies.',
    ],
  },
  {
    title: 'Cancellation and Refunds',
    points: [
      'Customers may cancel a booking without a cancellation fee under the published MySawari cancellation policy.',
      'Eligible refunds are processed to the original payment method.',
      'The published refund processing timeline is 7–10 business days after cancellation.',
      'Actual crediting time may depend on the payment provider or banking institution.',
      'Customers should contact hello@mysawari.in if a refund has not been received after the stated processing period.',
    ],
    note: 'See the Cancellation & Refund Policy for the complete cancellation and refund terms.',
  },
  {
    title: 'Privacy and Personal Information',
    points: [
      'MySawari processes personal information as described in its Privacy Policy.',
      'Information may include account details, contact information, identity verification documents, booking records, payment-related information, device information, and location information where applicable.',
      'Device permissions will be requested when required for relevant features.',
      'Customers should review the Privacy Policy to understand data use, sharing, retention, security, and available privacy rights.',
    ],
  },
  {
    title: 'Complaints and Grievances',
    points: [
      'Customers may submit complaints regarding bookings, payments, refunds, vehicle condition, account access, or personal information.',
      'Email: hello@mysawari.in.',
      'Grievance officer: [INSERT DESIGNATED OFFICER NAME].',
      'Grievance contact number: [INSERT VERIFIED PHONE NUMBER].',
      'Grievance email: [INSERT DESIGNATED GRIEVANCE EMAIL, IF DIFFERENT].',
      'Customers retain any remedies available under applicable Indian law.',
    ],
  },
  {
    title: 'Changes and Governing Law',
    points: [
      'MySawari may update these terms when necessary, subject to applicable law.',
      'Material changes will be communicated through appropriate channels where required.',
      'These terms are governed by the laws of India.',
      'The published website terms specify the courts in Guwahati, Assam, as the exclusive jurisdiction for disputes, subject to applicable law.',
    ],
  },
];

const PRIVACY_CLAUSES: Clause[] = [
  {
    title: 'Introduction and Data Controller',
    points: [
      'MySawari is operated by Yumly Lifestyle (OPC) Private Limited.',
      'Registered address: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
      'This policy explains how MySawari collects, uses, stores, shares, and protects personal information when customers use the application, website, and rental services.',
      'Privacy contact: hello@mysawari.in.',
    ],
  },
  {
    title: 'Personal Information We Collect',
    points: [
      {
        text: 'Account and Contact Information',
        sub: [
          'Full name, mobile number, email address, and alternate contact number where provided.',
          'Residential address, pickup address, and other address details required for the relevant service.',
          'Account preferences and communication settings.',
        ],
      },
      {
        text: 'Identity and Verification Information',
        sub: [
          'Driving licence and relevant verification details.',
          'Masked Aadhaar or another accepted identity document, where required.',
          'Document images, verification status, and related records.',
          'Verification photographs or additional documents where necessary and lawfully requested.',
        ],
      },
      {
        text: 'Booking and Payment Information',
        sub: [
          'Booking history, rental duration, pickup and return details, and selected vehicle or package.',
          'Payment amount, transaction reference, payment status, refund status, and related records.',
          'Billing details and other information needed to process a transaction.',
          'Bank account details only where necessary for a disclosed refund or settlement purpose.',
        ],
      },
      {
        text: 'Technical and Usage Information',
        sub: [
          'IP address, device information, operating system, app version, and diagnostic logs.',
          'Login timestamps, session identifiers, authentication status, and security events.',
          'Application interactions and technical information needed to maintain service security.',
        ],
      },
      {
        text: 'Location Information',
        sub: [
          'Approximate location or precise GPS coordinates, depending on the permission granted and feature used.',
          'Pickup, drop-off, and selected destination information.',
          'Background location only where a specific feature requires it, the purpose has been disclosed, and applicable permission and legal requirements have been satisfied.',
          'Vehicle location information, if a vehicle-tracking feature is actually used and separately disclosed.',
        ],
      },
    ],
    note: 'The categories collected depend on the feature used. MySawari should not collect every category automatically merely because an account is created.',
  },
  {
    title: 'How We Use Personal Information',
    points: [
      'To create and manage customer accounts.',
      'To verify mobile numbers, authenticate logins, and protect accounts against unauthorised access.',
      'To verify identity and driving eligibility before a rental where required.',
      'To process bookings, vehicle handovers, returns, payments, and refunds.',
      'To coordinate pickup, return, navigation, and roadside assistance where applicable.',
      'To communicate booking confirmations, rental reminders, transaction updates, and service notices.',
      'To investigate complaints, resolve disputes, prevent fraud, and maintain service security.',
      'To comply with applicable legal obligations and establish, exercise, or defend legal claims where necessary.',
      'To send optional marketing communications only in accordance with applicable consent and communication requirements.',
    ],
  },
  {
    title: 'Location and GPS Permissions',
    points: [
      'Approximate location may be used to help identify nearby vehicles or relevant service areas.',
      'Precise location may be used for accurate pickup, navigation, or other location-dependent features.',
      'Background location will be requested separately where the relevant feature genuinely requires it.',
      'Before background collection begins, MySawari should explain the purpose, collection circumstances, and how the permission can be disabled.',
      'Users can manage device location permissions through their device settings.',
      'If location permission is denied, some location-dependent features may be unavailable. Manual location selection should be offered where reasonably feasible.',
      'Location data will be accessed and retained only as necessary for the disclosed purpose and applicable legal requirements.',
    ],
  },
  {
    title: 'Identity Documents and Aadhaar',
    points: [
      'MySawari may request a driving licence, masked Aadhaar, or another legally acceptable document when necessary for rental verification.',
      'Customers should upload documents only through the designated, secure verification flow.',
      'Masked Aadhaar should be preferred where sufficient for the verification purpose and permitted by applicable requirements.',
      'Identity documents will be accessed by authorised personnel or verification providers where necessary for the disclosed purpose.',
      'Documents will not be used for unrelated purposes without an appropriate lawful basis.',
      'Document retention, deletion, and access will be handled according to applicable law and the disclosed retention requirements.',
    ],
  },
  {
    title: 'Payments and Banking Information',
    points: [
      'Payments may be processed through third-party payment service providers.',
      'MySawari may receive transaction references, payment status, amounts, and other information necessary to manage bookings and refunds.',
      'Bank account details may be requested where necessary for a disclosed refund or settlement process.',
      'Payment information will be shared with relevant payment providers, banks, or other authorised parties where necessary and lawful.',
      'Customers must never provide their UPI PIN, CVV, banking password, or OTP to customer support.',
      'The actual payment provider, data handled, and applicable payment-security arrangements should be disclosed through the relevant payment flow.',
    ],
  },
  {
    title: 'Device Information, Sessions and Security',
    points: [
      'IP addresses, device details, session identifiers, and login records may be processed to maintain account security and diagnose technical issues.',
      'Security logs may be used to detect suspicious activity, investigate incidents, and protect the service.',
      'Session information may be used to maintain authenticated access and manage account sessions.',
      'Access to personal information should be restricted to authorised personnel who need it for their responsibilities.',
      'Reasonable technical and organisational safeguards will be used to protect personal information against unauthorised access, loss, misuse, or disclosure.',
    ],
  },
  {
    title: 'Notifications and Communications',
    points: [
      'Service notifications may include booking confirmations, payment updates, rental reminders, security alerts, and refund information.',
      'Push notifications require the relevant device permission where applicable.',
      'Optional promotional messages will be managed according to applicable consent and communication requirements.',
      'Customers may change notification preferences or disable device notifications through available controls.',
      'Disabling promotional notifications does not necessarily disable essential service communications.',
    ],
  },
  {
    title: 'How We Share Information',
    points: [
      'With authorised personnel who need information to provide and manage rental services.',
      'With payment providers and banks for payment processing, refunds, and settlements.',
      'With identity verification providers where required for a disclosed verification purpose.',
      'With hosting, security, analytics, messaging, and technical service providers where actually used and appropriately authorised.',
      'With roadside assistance or other service partners where necessary to deliver a requested service.',
      'With regulators, law enforcement, courts, or other authorities where disclosure is legally required or otherwise lawfully permitted.',
      'In connection with a corporate restructuring or transfer where lawful and subject to appropriate safeguards.',
      'MySawari should not sell personal information or disclose it for unrelated purposes without an appropriate lawful basis.',
    ],
  },
  {
    title: 'Retention and Deletion',
    points: [
      'Personal information will be retained only for as long as necessary for the disclosed purpose, applicable legal obligations, security, and legitimate dispute-resolution requirements.',
      'Different categories of information may have different retention periods.',
      'Identity documents, location history, payment records, and technical logs should have defined retention periods appropriate to their purposes.',
      'When information is no longer required and no legal retention obligation applies, it will be securely deleted or anonymised as appropriate.',
      'Customers may request account deletion through available account controls or by contacting hello@mysawari.in.',
      'Some records may need to be retained where required by law or necessary to establish, exercise, or defend legal claims.',
    ],
    note: 'Publish specific retention periods once the company has confirmed its actual retention schedule and legal obligations.',
  },
  {
    title: 'Your Privacy Choices and Rights',
    points: [
      'Customers may request access to or correction of personal information where available under applicable law.',
      'Customers may request deletion or raise concerns about processing, subject to applicable legal obligations and exceptions.',
      'Where processing relies on consent, customers may withdraw that consent through the available controls or by contacting MySawari.',
      'Customers may manage device permissions for location, camera, and notifications through device settings.',
      'Withdrawal of consent does not invalidate processing lawfully carried out before withdrawal.',
      'If information is necessary for a requested rental feature, withdrawing the relevant consent may make that feature unavailable.',
      'Requests will be handled in accordance with applicable Indian data-protection law.',
    ],
  },
  {
    title: 'Children and Eligibility',
    points: [
      'MySawari rental services are subject to the applicable age and driving eligibility requirements.',
      'The published website terms specify a minimum renter age of 21 years.',
      'MySawari does not intentionally seek personal information from individuals who are ineligible to use the relevant service.',
      'Any processing involving children or other protected individuals must comply with applicable legal requirements.',
    ],
  },
  {
    title: 'Data Breaches and Complaints',
    points: [
      'Suspected unauthorised access or misuse of personal information may be reported to hello@mysawari.in.',
      'MySawari will assess and address personal data incidents in accordance with applicable legal requirements.',
      'Required notifications to affected individuals or authorities will be made where applicable.',
      'Privacy complaints may be escalated to the designated grievance officer.',
      'Grievance officer: [INSERT DESIGNATED OFFICER NAME].',
      'Grievance contact number: [INSERT VERIFIED PHONE NUMBER].',
      'Grievance email: [INSERT DESIGNATED GRIEVANCE EMAIL, IF DIFFERENT].',
    ],
  },
  {
    title: 'Policy Changes and Contact',
    points: [
      'This Privacy Policy may be updated to reflect changes in services, data practices, or applicable law.',
      'Material changes will be communicated where required.',
      'Company: Yumly Lifestyle (OPC) Private Limited, operating as MySawari.',
      'Registered address: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
      'Website: https://www.mysawari.in.',
      'Privacy contact: hello@mysawari.in.',
    ],
  },
];

const CANCELLATION_CLAUSES: Clause[] = [
  {
    title: 'Introduction and Zero Cancellation Fees',
    points: [
      'This policy applies to eligible vehicle bookings made through the MySawari application, website, or authorised booking channels.',
      'MySawari is operated by Yumly Lifestyle (OPC) Private Limited.',
      'Eligible bookings cancelled before vehicle handover have zero cancellation fees.',
      'Eligible prepaid rental amounts will be refunded under this policy and the applicable booking conditions.',
      'Any non-refundable third-party charge must be clearly disclosed before payment and may be deducted only where legally permissible.',
    ],
  },
  {
    title: 'Cancellation Before or After Handover',
    points: [
      'Before handover, the zero-cancellation-fee policy applies to eligible bookings.',
      'After handover, the booking is an active rental and early return or termination is governed by the applicable rental agreement.',
      'Refunds for unused rental time, where available, follow the conditions disclosed before booking.',
      'Any additional charge must be contractually authorised, reasonable, and legally permissible.',
    ],
  },
  {
    title: 'How to Cancel a Booking',
    points: [
      {
        text: 'Through the Application',
        sub: ['Open MySawari.', 'Go to My Bookings.', 'Select the relevant booking.', 'Choose Cancel Booking.', 'Review and confirm the cancellation.'],
      },
      'The application should display the cancellation status and refund details.',
      'If the in-app option is unavailable, contact an authorised support channel with the booking reference.',
    ],
  },
  {
    title: 'Cancellation by MySawari and No-Show',
    points: [
      'MySawari may cancel a booking because of vehicle unavailability, safety concerns, operational difficulties, unforeseen circumstances, or failed eligibility or verification.',
      'Where MySawari cannot provide a confirmed service, an acceptable alternative or applicable refund may be offered.',
      'Where cancellation results from customer ineligibility or invalid documents, the refund follows the disclosed failed-verification conditions and applicable law.',
      'Customers should arrive at the agreed pickup time and contact MySawari if delayed.',
      'Any no-show period, waiting time, or related charge must be disclosed before booking.',
      'Late pickup does not automatically extend the rental period.',
    ],
  },
  {
    title: 'Refund Processing and Method',
    points: [
      'Eligible refunds will ordinarily be processed within 7–10 business days.',
      'The time for funds to appear depends on the payment provider or receiving financial institution.',
      'Refunds are ordinarily initiated through the original payment method.',
      'Where the original method cannot be used, an alternative may be arranged after verification.',
      'Customers must never provide UPI PINs, card CVVs, banking passwords, or OTPs to receive a refund.',
    ],
  },
  {
    title: 'Security Deposit Settlement',
    points: [
      'Where a refundable security deposit is collected, MySawari may inspect the returned vehicle before settlement.',
      'Legitimate deductions may include documented damage, missing accessories, extra kilometres, fuel shortages, late-return charges, and other disclosed lawful amounts.',
      'MySawari will provide an itemised explanation of deductions.',
      'Undisputed deposit balances will be refunded within the settlement period communicated at booking.',
      'Deposit settlement period: [TO BE CONFIRMED].',
    ],
  },
  {
    title: 'Failed Payments, Duplicates and Disputes',
    points: [
      'Failed transactions, duplicate deductions, incorrect payment status, delayed refunds, incorrect deposit deductions, damage charges, and extra-kilometre charges may be disputed.',
      'MySawari will review the relevant booking, payment, inspection, and transaction records.',
      'Customers may provide supporting documents or explanations.',
      'Verified excess payments will be refunded through the applicable payment channel.',
    ],
  },
  {
    title: 'Complaints and Escalation',
    points: [
      'Customers may raise a complaint if a cancellation or refund is delayed or incorrectly handled.',
      'Support email: hello@mysawari.in.',
      'Grievance officer: [INSERT DESIGNATED OFFICER NAME].',
      'Grievance contact number: [INSERT VERIFIED PHONE NUMBER].',
      'Grievance email: [INSERT DESIGNATED GRIEVANCE EMAIL, IF DIFFERENT].',
      'Customers retain any remedies available under applicable Indian law.',
    ],
  },
  {
    title: 'Company Information',
    points: [
      'Brand: MySawari.',
      'Legal entity: Yumly Lifestyle (OPC) Private Limited.',
      'Registered address: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
      'Website: https://www.mysawari.in.',
      'Customer support: hello@mysawari.in.',
    ],
  },
];

const CONSENT_CLAUSES: Clause[] = [
  {
    title: 'Welcome and Registration Consent',
    points: [
      'To create and secure a MySawari account, we collect your name, mobile number, email address, and necessary login information.',
      'For bookings, we may request your address, alternate contact number, driving licence, masked Aadhaar or another accepted identity document, and payment details.',
      'Certain features may request location, camera, or notification permissions when they are needed.',
      'Read the Privacy Policy to learn how MySawari collects, uses, shares, protects, and deletes information.',
      'This policy explains how consent is requested, recorded, managed, and withdrawn.',
      'During registration, users receive the Terms & Conditions, Privacy Policy, required registration data, processing purposes, and privacy and grievance contact details.',
      'Users must accept the applicable Terms & Conditions before creating an account.',
      'By selecting Agree & Continue, users confirm that they meet the applicable account registration requirements.',
      'Optional processing consent will not be bundled with mandatory contractual acceptance.',
    ],
  },
  {
    title: 'Registration and Authentication',
    points: [
      'MySawari may request full name, mobile number, email address, address where necessary, and other registration information described in the Privacy Policy.',
      'OTP authentication may process the mobile number, OTP status, login timestamp, IP address, device information, session identifier, and security events.',
      'MySawari will not request users to disclose OTPs to support staff.',
    ],
  },
  {
    title: 'Identity Verification and Permissions',
    points: [
      'Identity verification may require a driving licence, masked Aadhaar or accepted identity document, address proof, and a verification photograph where necessary.',
      'Documents are used only for disclosed verification and lawful rental-related purposes and not unrelated marketing.',
      'Location, background location, camera, selected files or photos, and notifications are requested only when the relevant feature needs them.',
      'Users may deny or revoke device permissions through system settings; manual location selection should remain available where feasible.',
    ],
  },
  {
    title: 'Notifications, Payments and Marketing',
    points: [
      'Notifications may include booking confirmations, payment alerts, rental reminders, refund updates, security notifications, and important service information.',
      'Payment information may be handled by authorised payment providers; users must never share UPI PINs, CVVs, banking passwords, or OTPs.',
      'Marketing consent is optional and may be withdrawn without losing access to unrelated core rental services.',
      'Optional promotional offers and marketing communications require a separate affirmative choice.',
    ],
  },
  {
    title: 'Consent Records, Withdrawal and Deletion',
    points: [
      'MySawari may record the account identifier, consent purpose, policy version, status, date and time, collection channel, and withdrawal date.',
      'Where processing relies on consent, users may withdraw it through available controls or by contacting MySawari.',
      'Withdrawal may make a feature unavailable and does not automatically require deletion of records subject to lawful retention.',
      'Users may request account deletion through account controls once implemented or through hello@mysawari.in; legally retained information may remain.',
    ],
    note: 'Support email: hello@mysawari.in. Registered office: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
  },
];

const GRIEVANCE_CLAUSES: Clause[] = [
  {
    title: 'Scope and Support Channels',
    points: [
      'Customers may raise concerns about accounts, OTPs, verification, vehicle availability, cancellations, refunds, deposits, vehicle condition, charges, location tracking, personal data, deletion, service, fraud, or unauthorised transactions.',
      'Support email: hello@mysawari.in.',
      'Customer care number: [TO BE CONFIRMED].',
      'Grievance officer, helpline, email, and support hours: [TO BE CONFIRMED].',
      'Registered office: T10 1B, Uttarayan Ville, Kahilipara, Guwahati, Assam – 781019.',
    ],
  },
  {
    title: 'Submitting and Registering a Complaint',
    points: [
      'Customers should provide their name, registered mobile or email, booking reference, issue description, transaction reference, and supporting documents where necessary.',
      'Customers must not submit OTPs, UPI PINs, banking passwords, or other authentication secrets.',
      'MySawari should generate and communicate a unique complaint reference number for each registered grievance.',
    ],
  },
  {
    title: 'Investigation, Resolution and Escalation',
    points: [
      'MySawari will review relevant booking, payment, communication, inspection, verification, security, and supporting records fairly.',
      'Ordinary complaints may be acknowledged within 24–48 hours as an internal service target, subject to statutory timelines.',
      'Customers dissatisfied with the initial response may request escalation to the designated grievance officer using the complaint reference.',
      'Privacy complaints, refund and payment complaints, safety complaints, and suspected fraud will be directed to the responsible support or grievance contact.',
    ],
  },
  {
    title: 'External Remedies and Confidentiality',
    points: [
      'Customers retain the right to approach competent consumer forums, courts, regulators, or other authorities under applicable Indian law.',
      'Use of MySawari’s internal process does not eliminate statutory remedies.',
      'Complaint information will be handled under the Privacy Policy and access will be limited to personnel and authorised providers who reasonably require it.',
    ],
  },
];

export const POLICIES: Policy[] = [
  { key: 'terms', title: 'Terms & Conditions', clauses: TERMS_CLAUSES },
  { key: 'privacy', title: 'Privacy Policy', clauses: PRIVACY_CLAUSES },
  { key: 'cancellation', title: 'Cancellation & Refund Policy', clauses: CANCELLATION_CLAUSES },
  { key: 'consent', title: 'User Consent & App Permissions Policy', clauses: CONSENT_CLAUSES },
  { key: 'grievance', title: 'Grievance Redressal Policy', clauses: GRIEVANCE_CLAUSES },
];


function Bullet({ text, p, indent = 0 }: { text: string; p: DetailsPalette; indent?: number }) {
  return (
    <View style={[styles.bulletRow, { paddingLeft: 16.5 + indent * 16.5 }]}>
      <View style={[styles.bulletDot, { backgroundColor: p.muted }]} />
      <Text style={[styles.bulletText, { color: p.muted }]}>{text}</Text>
    </View>
  );
}

export function PolicyDocumentScreen({ policyKey }: { policyKey: PolicyKey }) {
  const p = useDetailsPalette();
  const policy = POLICIES.find((item) => item.key === policyKey) ?? POLICIES[0];
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <SubPageHeader title={policy.title} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.policyBlock}>
          <Text style={[styles.policyTitle, { color: p.fg }]}>{policy.title}</Text>
          {policy.clauses.map((clause, ci) => (
            <View key={clause.title} style={[styles.clause, ci === 0 && styles.firstClause]}>
              <Text style={[styles.clauseTitle, { color: p.fg }]}>{ci + 1}.  {clause.title}</Text>
              <View style={styles.points}>
                {clause.points.map((pt) =>
                  typeof pt === 'string' ? (
                    <Bullet key={pt} text={pt} p={p} />
                  ) : (
                    <View key={pt.text} style={{ gap: 3 }}>
                      <Bullet text={pt.text} p={p} />
                      {pt.sub.map((s) => <Bullet key={s} text={s} p={p} indent={1} />)}
                    </View>
                  ),
                )}
              </View>
              {!!clause.note && <Text style={[styles.note, { color: p.muted }]}>{clause.note}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PolicyScreen() {
  return <PolicyDocumentScreen policyKey="terms" />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 82, gap: 12 },
  policyBlock: { width: '100%', paddingVertical: 4, gap: 12 },
  policyBlockSeparated: { marginTop: 0 },
  policyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 23 },
  clause: { gap: 4, marginTop: 4 },
  firstClause: { marginTop: 0 },
  clauseTitle: { paddingLeft: 19.5, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  points: { gap: 0 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 6 },
  bulletDot: { width: 3, height: 3, borderRadius: 1.5, marginTop: 7, marginRight: 8 },
  bulletText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5 },
  note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, marginTop: 0 },
});
