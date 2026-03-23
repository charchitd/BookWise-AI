import { FileText, Shield, Database, Sparkles } from "lucide-react"

export const POLICY_VERSION = 'v1.0'

export type Policy = {
  id: string;
  title: string;
  icon: any;
  content: string;
}

export const POLICIES: Policy[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: FileText,
    content: `
## 1. Acceptance of Terms & Eligibility
By accessing or using the BookWise AI platform, you agree to be bound by these Terms of Service. You must be at least 18 years of age to establish an account and use the Services. By creating an account, you represent and warrant that you meet this age requirement. If you are accessing the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

## 2. Account Registration and Rules
You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree not to share, transfer, or resell your account credentials. You must notify us immediately of any unauthorized use of your account. BookWise AI reserves the right to suspend or terminate accounts that violate these Terms, engage in abusive behavior, or disrupt the Service for other users. We may also impose limits on certain features without notice.

## 3. Uploaded Content & Intellectual Property
You retain all ownership rights to the documents, PDFs, and text you upload to BookWise AI. However, by uploading content, you grant BookWise AI a limited, worldwide, non-exclusive license to process, store, and utilize this content solely for the purpose of providing the Services (such as generating summaries, quizzes, and embeddings). You warrant that you have the necessary rights to upload any content and that it does not infringe upon any third-party copyrights or intellectual property rights. BookWise AI does not claim ownership over any user-generated content.

## 4. AI Disclaimer and Limitations
The Services rely on artificial intelligence models, including those provided by Anthropic and OpenAI. AI-generated outputs, including summaries, tutor responses, and quizzes, are produced algorithmically and may occasionally be inaccurate, incomplete, or misleading. They should not be relied upon as professional, legal, or authoritative advice. You use the generated content at your own risk. BookWise AI makes no warranties regarding the accuracy, reliability, or completeness of the AI-generated responses.

## 5. Payments, Subscriptions, and Refunds
Certain features of BookWise AI require a paid subscription. All fees are clearly stated at the time of purchase. Subscriptions bill automatically based on your selected billing cycle. You may cancel your subscription at any time, but cancellations will take effect at the end of the current billing cycle. We offer a 7-day money-back guarantee for initial purchases; refund requests must be submitted within 7 days of the transaction. Payments are processed securely via third-party providers such as Razorpay.

## 6. Limitation of Liability
To the maximum extent permitted by applicable law, BookWise AI and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your access to or use of the Service.

## 7. Governing Law and Jurisdiction
These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to these Terms or the use of the Service shall be subject to the exclusive jurisdiction of the courts located in Bengaluru, Karnataka, India.
    `.trim()
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: Shield,
    content: `
## 1. Information We Collect
When you use BookWise AI, we collect personal information necessary to provide and improve our services. This includes your email address, account credentials, and usage data (such as login frequency and interaction metrics). We also collect the content you upload, including PDFs, generated text, and AI embeddings required to facilitate the tutoring and quiz features. Your interactions with the AI tutor are recorded to provide a seamless contextual experience.

## 2. No Data Selling
We firmly believe that your data is your own. Under no circumstances does BookWise AI sell, rent, or lease your personal information, uploaded documents, or derived AI embeddings to third parties, data brokers, or advertising agencies. Your data is strictly used to deliver the features of the BookWise AI platform to you.

## 3. Sub-Processors and Third Parties
To provide our Services, we rely on trusted third-party sub-processors. These include Supabase for secure database and authentication services, Vercel for hosting our application infrastructure, Razorpay for processing financial transactions, and AI model providers such as Anthropic and OpenAI for generating insights. All sub-processors are bound by strict confidentiality and data protection agreements to ensure your information is treated securely.

## 4. Your Privacy Rights (DPDPA / GDPR)
Depending on your legal jurisdiction, including the Digital Personal Data Protection Act (DPDPA) of India or the General Data Protection Regulation (GDPR) of the European Union, you possess certain rights regarding your data. These include the right to access the personal data we hold about you, the right to request correction of inaccurate data, the right to request deletion of your data (the "right to be forgotten"), and the right to export your data in a portable format. 

## 5. Security and Breach Notification
BookWise AI implements industry-standard administrative, technical, and physical security measures designed to protect your information from unauthorized access or disclosure. In the unlikely event of a data breach that compromises your personal information, we are committed to notifying you and the relevant supervisory authorities within 72 hours of discovering the breach, providing details on exactly what information was compromised and the steps we are taking to mitigate the event.

## 6. Changes to this Privacy Policy
We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. If substantial changes are made, we will notify you by email or via a prominent notice within the application. Continued use of the Services after such changes constitutes your acknowledgment of the updated policy.
    `.trim()
  },
  {
    id: 'data-processing',
    title: 'Data Processing Agreement',
    icon: Database,
    content: `
## 1. Scope and Legal Basis
This Data Processing Agreement (DPA) outlines the terms, requirements, and conditions under which BookWise AI processes personal data on your behalf. By accepting our underlying terms, you instruct BookWise AI to process data for the sole purpose of delivering our educational and AI services. We act as the Data Processor, and you act as the Data Controller with respect to the documents and personal records you upload. The legal basis for this processing is the fulfillment of the service contract established between us.

## 2. Approved Sub-Processor Table
In order to deliver a high-quality, modern application, BookWise AI utilizes the following sub-processors for specific infrastructure and computational needs:
- **Supabase**: Cloud database storage, application authentication, and secure bucket storage for uploaded PDFs.
- **Anthropic & OpenAI**: Large Language Models utilized solely via API to generate educational summaries, quizzes, and tutor responses.
- **Vercel**: Edge network content delivery, application hosting, and serverless function execution.
- **Razorpay**: Secure merchant processing and handling of payment-related data (we do not store your raw credit card data).

We ensure that all sub-processors provide adequate legal and technical safeguards for data processing.

## 3. Data Deletion and Retention
You maintain complete control over the lifecycle of your data. If you choose to delete an uploaded book, chapter, or tutor session, that data is immediately soft-deleted from active views and permanently wiped from our database and storage buckets (including Supabase PGVector embeddings) within 30 days. When you delete your entire BookWise AI account, all associated records, metadata, and files are permanently purged across all systems within 30 days, complying with global data retention minimizing principles.

## 4. Data Export and Portability
We respect your ownership of your educational data. As the Data Controller, you may request an export of your personal data, including the curricula generated, notes taken, and quiz attempts logged. Upon request, BookWise AI will assemble this information and provide it to you in a standard, machine-readable JSON format, ensuring data portability across platforms.

## 5. Audits and Compliance
BookWise AI will maintain verifiable records of its processing activities to demonstrate compliance with these obligations. In the event of an inquiry by a data protection authority, we will provide the necessary assistance and contextual information required to satisfy regulatory requests concerning your data.
    `.trim()
  },
  {
    id: 'ai-usage',
    title: 'AI Usage Policy',
    icon: Sparkles,
    content: `
## 1. AI Under the Hood
BookWise AI heavily leverages state-of-the-art Large Language Models provided primarily by Anthropic (Claude) and OpenAI. These models power our core interactive features: generating chapter summaries, dynamically creating diverse quizzes, structuring automated curricula, and answering your questions via the AI tutor. These models interpret the vector embeddings generated from your documents to provide highly contextual, book-specific answers.

## 2. No Model Training on User Data
We strongly value your intellectual property and data privacy. BookWise AI explicitly prohibits the use of your uploaded documents, personal notes, tutor chat history, or internal interactions to train, fine-tune, or improve the foundational AI models of our providers. Our API agreements with Anthropic and OpenAI guarantee that customer data sent via API is strictly isolated and never ingested into public training datasets. Your private data remains your own private data.

## 3. Transparency on Inaccuracies ("Hallucinations")
While we engineer our software to anchor the AI's responses exclusively within the provided text (Retrieval-Augmented Generation), artificial intelligence is an evolving technology subject to probabilistic errors. The AI may occasionally misinterpret nuance, conflate characters, or confidently state incorrect facts—a phenomenon commonly described as "hallucination." Users are encouraged to cross-reference AI-generated summaries and quiz answers with the source material, especially for academic, technical, or legal texts.

## 4. Control Over Chat History
Your interactions with the AI tutor are stored in our secure database to seamlessly pick up conversations where you left off. However, you retain the continuous right to delete any part of your conversation history at any time. Erasing a chat history removes the conversational context from our servers and immediately prevents the AI from referencing that historical dialogue in future interactions. 

## 5. Acceptable AI Usage
By using our AI features, you agree not to attempt to reverse-engineer, "jailbreak," or prompt-inject the system to bypass our moderation filters. You may not use the AI to generate illegal, harmful, or grossly offensive content, nor can you utilize automated bots to rapidly scrape or abuse the AI tutor endpoints. Violation of these sensible usage limits will lead to immediate account suspension to protect our infrastructure and community.
    `.trim()
  }
]
