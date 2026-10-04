import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  writeBatch,
  type DocumentData,
  type QuerySnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AndroidApp, AppStatus, Website, Submission, AppFormData, WebsiteFormData, SubmissionFormData } from '../types';

declare global {
  interface Window {
    __USE_MOCK_STORAGE__?: boolean;
    __MOCK_DATA__?: {
      apps: AndroidApp[];
      websites: Website[];
      submissions: Submission[];
    };
  }
}

// In-memory mock storage state
let mockApps: AndroidApp[] = [];
let mockWebsites: Website[] = [];
let mockSubmissions: Submission[] = [];

type Listener<T> = (data: T[]) => void;
const mockAppListeners: Set<Listener<AndroidApp>> = new Set();
const mockWebsiteListeners: Set<Listener<Website>> = new Set();
const mockSubmissionListeners: Set<Listener<Submission>> = new Set();

const notifyMockApps = () => {
  const data = [...mockApps];
  if (window.__MOCK_DATA__) window.__MOCK_DATA__.apps = data;
  mockAppListeners.forEach((l) => l(data));
};
const notifyMockWebsites = () => {
  const data = [...mockWebsites];
  if (window.__MOCK_DATA__) window.__MOCK_DATA__.websites = data;
  mockWebsiteListeners.forEach((l) => l(data));
};
const notifyMockSubmissions = () => {
  const data = [...mockSubmissions];
  if (window.__MOCK_DATA__) window.__MOCK_DATA__.submissions = data;
  mockSubmissionListeners.forEach((l) => l(data));
};

export const isMockMode = (): boolean => {
  if (typeof window !== 'undefined') {
    if (window.__USE_MOCK_STORAGE__ === true) return true;
    if (window.location.search.includes('mock=true')) return true;
  }
  return import.meta.env.VITE_USE_MOCK === 'true';
};

export const resetMockData = () => {
  mockApps = [];
  mockWebsites = [];
  mockSubmissions = [];
  if (typeof window !== 'undefined') {
    window.__MOCK_DATA__ = {
      apps: mockApps,
      websites: mockWebsites,
      submissions: mockSubmissions,
    };
  }
  notifyMockApps();
  notifyMockWebsites();
  notifyMockSubmissions();
};

const formatTimestamp = (val: unknown): string => {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' && val.length > 0) return val;
  return new Date().toISOString();
};

// ===================== ANDROID APPS =====================

export const subscribeApps = (callback: (apps: AndroidApp[]) => void): (() => void) => {
  if (isMockMode()) {
    mockAppListeners.add(callback);
    callback([...mockApps]);
    return () => {
      mockAppListeners.delete(callback);
    };
  }

  const q = query(collection(db, 'androidApps'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: AndroidApp[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name ?? '',
          status: (data.status as AppStatus) || 'published',
          playStoreUrl: data.playStoreUrl ?? '',
          landingPageUrl: data.landingPageUrl ?? '',
          videoUrl: data.videoUrl ?? '',
          notes: data.notes ?? '',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore subscribeApps error:', err);
    }
  );
};

export const createApp = async (formData: AppFormData): Promise<string> => {
  const trimmedName = formData.name.trim();
  if (!trimmedName) {
    throw new Error('App name cannot be empty');
  }

  if (isMockMode()) {
    const now = new Date().toISOString();
    const newApp: AndroidApp = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: trimmedName,
      status: formData.status || 'published',
      playStoreUrl: formData.playStoreUrl.trim(),
      landingPageUrl: (formData.landingPageUrl || '').trim(),
      videoUrl: (formData.videoUrl || '').trim(),
      notes: formData.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    mockApps = [newApp, ...mockApps];
    notifyMockApps();
    return newApp.id;
  }

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'androidApps'), {
    name: trimmedName,
    status: formData.status || 'published',
    playStoreUrl: formData.playStoreUrl.trim(),
    landingPageUrl: (formData.landingPageUrl || '').trim(),
    videoUrl: (formData.videoUrl || '').trim(),
    notes: formData.notes.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtFallback: now,
  });
  return docRef.id;
};

export const updateApp = async (id: string, formData: Partial<AppFormData>): Promise<void> => {
  if (formData.name !== undefined && !formData.name.trim()) {
    throw new Error('App name cannot be empty');
  }

  if (isMockMode()) {
    const idx = mockApps.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('App not found');
    mockApps[idx] = {
      ...mockApps[idx],
      name: formData.name !== undefined ? formData.name.trim() : mockApps[idx].name,
      status: formData.status !== undefined ? formData.status : (mockApps[idx].status || 'published'),
      playStoreUrl: formData.playStoreUrl !== undefined ? formData.playStoreUrl.trim() : mockApps[idx].playStoreUrl,
      landingPageUrl: formData.landingPageUrl !== undefined ? formData.landingPageUrl.trim() : mockApps[idx].landingPageUrl,
      videoUrl: formData.videoUrl !== undefined ? formData.videoUrl.trim() : mockApps[idx].videoUrl,
      notes: formData.notes !== undefined ? formData.notes.trim() : mockApps[idx].notes,
      updatedAt: new Date().toISOString(),
    };
    notifyMockApps();
    return;
  }

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (formData.name !== undefined) updates.name = formData.name.trim();
  if (formData.status !== undefined) updates.status = formData.status;
  if (formData.playStoreUrl !== undefined) updates.playStoreUrl = formData.playStoreUrl.trim();
  if (formData.landingPageUrl !== undefined) updates.landingPageUrl = formData.landingPageUrl.trim();
  if (formData.videoUrl !== undefined) updates.videoUrl = formData.videoUrl.trim();
  if (formData.notes !== undefined) updates.notes = formData.notes.trim();

  await updateDoc(doc(db, 'androidApps', id), updates);
};

export const deleteApp = async (id: string, currentSubmissions: Submission[]): Promise<void> => {
  const relatedCount = currentSubmissions.filter((s) => s.appId === id).length;
  if (relatedCount > 0) {
    throw new Error(
      `Cannot delete this app because it is used in ${relatedCount} submission(s). Please delete or reassign those submissions first.`
    );
  }

  if (isMockMode()) {
    mockApps = mockApps.filter((a) => a.id !== id);
    notifyMockApps();
    return;
  }

  await deleteDoc(doc(db, 'androidApps', id));
};

// ===================== WEBSITES =====================

export const subscribeWebsites = (callback: (websites: Website[]) => void): (() => void) => {
  if (isMockMode()) {
    mockWebsiteListeners.add(callback);
    callback([...mockWebsites]);
    return () => {
      mockWebsiteListeners.delete(callback);
    };
  }

  const q = query(collection(db, 'websites'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: Website[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name ?? '',
          url: data.url ?? '',
          notes: data.notes ?? '',
          dr: typeof data.dr === 'number' ? data.dr : undefined,
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore subscribeWebsites error:', err);
    }
  );
};

export const createWebsite = async (formData: WebsiteFormData): Promise<string> => {
  const trimmedName = formData.name.trim();
  if (!trimmedName) {
    throw new Error('Website name cannot be empty');
  }

  if (isMockMode()) {
    const now = new Date().toISOString();
    const newSite: Website = {
      id: 'site_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: trimmedName,
      url: formData.url.trim(),
      notes: formData.notes.trim(),
      dr: typeof formData.dr === 'number' ? formData.dr : undefined,
      createdAt: now,
      updatedAt: now,
    };
    mockWebsites = [newSite, ...mockWebsites];
    notifyMockWebsites();
    return newSite.id;
  }

  const now = new Date().toISOString();
  const docData: Record<string, unknown> = {
    name: trimmedName,
    url: formData.url.trim(),
    notes: formData.notes.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtFallback: now,
  };
  if (typeof formData.dr === 'number') {
    docData.dr = formData.dr;
  }
  const docRef = await addDoc(collection(db, 'websites'), docData);
  return docRef.id;
};

export const createWebsitesBatch = async (websitesList: WebsiteFormData[]): Promise<number> => {
  if (websitesList.length === 0) return 0;

  if (isMockMode()) {
    const now = new Date().toISOString();
    const newSites: Website[] = websitesList.map((formData, idx) => ({
      id: 'site_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7),
      name: formData.name.trim(),
      url: formData.url.trim(),
      notes: formData.notes.trim(),
      dr: typeof formData.dr === 'number' ? formData.dr : undefined,
      createdAt: now,
      updatedAt: now,
    }));
    mockWebsites = [...newSites, ...mockWebsites];
    notifyMockWebsites();
    return newSites.length;
  }

  const chunkSize = 450;
  let count = 0;
  for (let i = 0; i < websitesList.length; i += chunkSize) {
    const chunk = websitesList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    for (const item of chunk) {
      const docRef = doc(collection(db, 'websites'));
      const docData: Record<string, unknown> = {
        name: item.name.trim(),
        url: item.url.trim(),
        notes: item.notes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAtFallback: now,
      };
      if (typeof item.dr === 'number') {
        docData.dr = item.dr;
      }
      batch.set(docRef, docData);
    }
    await batch.commit();
    count += chunk.length;
  }
  return count;
};

export const updateWebsite = async (id: string, formData: Partial<WebsiteFormData>): Promise<void> => {
  if (formData.name !== undefined && !formData.name.trim()) {
    throw new Error('Website name cannot be empty');
  }

  if (isMockMode()) {
    const idx = mockWebsites.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error('Website not found');
    mockWebsites[idx] = {
      ...mockWebsites[idx],
      name: formData.name !== undefined ? formData.name.trim() : mockWebsites[idx].name,
      url: formData.url !== undefined ? formData.url.trim() : mockWebsites[idx].url,
      notes: formData.notes !== undefined ? formData.notes.trim() : mockWebsites[idx].notes,
      dr: formData.dr !== undefined ? formData.dr : mockWebsites[idx].dr,
      updatedAt: new Date().toISOString(),
    };
    notifyMockWebsites();
    return;
  }

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (formData.name !== undefined) updates.name = formData.name.trim();
  if (formData.url !== undefined) updates.url = formData.url.trim();
  if (formData.notes !== undefined) updates.notes = formData.notes.trim();
  if (formData.dr !== undefined) updates.dr = formData.dr;

  await updateDoc(doc(db, 'websites', id), updates);
};

export const deleteWebsite = async (id: string, currentSubmissions: Submission[]): Promise<void> => {
  const relatedCount = currentSubmissions.filter((s) => s.websiteId === id).length;
  if (relatedCount > 0) {
    throw new Error(
      `Cannot delete this website because it is used in ${relatedCount} submission(s). Please delete or reassign those submissions first.`
    );
  }

  if (isMockMode()) {
    mockWebsites = mockWebsites.filter((w) => w.id !== id);
    notifyMockWebsites();
    return;
  }

  await deleteDoc(doc(db, 'websites', id));
};

// ===================== SUBMISSIONS =====================

export const subscribeSubmissions = (callback: (submissions: Submission[]) => void): (() => void) => {
  if (isMockMode()) {
    mockSubmissionListeners.add(callback);
    callback([...mockSubmissions]);
    return () => {
      mockSubmissionListeners.delete(callback);
    };
  }

  const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: Submission[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          appId: data.appId ?? '',
          websiteId: data.websiteId ?? '',
          status: data.status ?? 'TODO',
          submissionDate: data.submissionDate ?? '',
          postUrl: data.postUrl ?? '',
          notes: data.notes ?? '',
          createdAt: formatTimestamp(data.createdAt),
          updatedAt: formatTimestamp(data.updatedAt),
        };
      });
      callback(items);
    },
    (err) => {
      console.error('Firestore subscribeSubmissions error:', err);
    }
  );
};

export const createSubmission = async (
  formData: SubmissionFormData,
  existingSubmissions: Submission[]
): Promise<string> => {
  if (!formData.appId) throw new Error('Please select an Android App');
  if (!formData.websiteId) throw new Error('Please select a Website');

  // Check for duplicate App + Website combination
  const isDuplicate = existingSubmissions.some(
    (s) => s.appId === formData.appId && s.websiteId === formData.websiteId
  );
  if (isDuplicate) {
    throw new Error('A submission for this App and Website combination already exists.');
  }

  const now = new Date().toISOString();
  const subDate = formData.submissionDate ? formData.submissionDate : '';
  const postUrl = formData.postUrl ? formData.postUrl.trim() : '';

  if (isMockMode()) {
    const newSub: Submission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      appId: formData.appId,
      websiteId: formData.websiteId,
      status: formData.status || 'APPROVED',
      submissionDate: subDate,
      postUrl: postUrl,
      notes: formData.notes ? formData.notes.trim() : '',
      createdAt: now,
      updatedAt: now,
    };
    mockSubmissions = [newSub, ...mockSubmissions];
    notifyMockSubmissions();
    return newSub.id;
  }

  const docRef = await addDoc(collection(db, 'submissions'), {
    appId: formData.appId,
    websiteId: formData.websiteId,
    status: formData.status || 'APPROVED',
    submissionDate: subDate,
    postUrl: postUrl,
    notes: formData.notes ? formData.notes.trim() : '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtFallback: now,
  });
  return docRef.id;
};

export const updateSubmission = async (
  id: string,
  formData: Partial<SubmissionFormData>,
  existingSubmissions?: Submission[]
): Promise<void> => {
  // If appId or websiteId are updated, check duplicate
  if (formData.appId && formData.websiteId && existingSubmissions) {
    const isDuplicate = existingSubmissions.some(
      (s) => s.id !== id && s.appId === formData.appId && s.websiteId === formData.websiteId
    );
    if (isDuplicate) {
      throw new Error('A submission for this App and Website combination already exists.');
    }
  }

  if (isMockMode()) {
    const idx = mockSubmissions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Submission not found');
    mockSubmissions[idx] = {
      ...mockSubmissions[idx],
      ...(formData.appId ? { appId: formData.appId } : {}),
      ...(formData.websiteId ? { websiteId: formData.websiteId } : {}),
      ...(formData.status ? { status: formData.status } : {}),
      ...(formData.submissionDate !== undefined ? { submissionDate: formData.submissionDate } : {}),
      ...(formData.postUrl !== undefined ? { postUrl: formData.postUrl.trim() } : {}),
      ...(formData.notes !== undefined ? { notes: formData.notes.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };
    notifyMockSubmissions();
    return;
  }

  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  if (formData.appId) updates.appId = formData.appId;
  if (formData.websiteId) updates.websiteId = formData.websiteId;
  if (formData.status) updates.status = formData.status;
  if (formData.submissionDate !== undefined) updates.submissionDate = formData.submissionDate;
  if (formData.postUrl !== undefined) updates.postUrl = formData.postUrl.trim();
  if (formData.notes !== undefined) updates.notes = formData.notes.trim();

  await updateDoc(doc(db, 'submissions', id), updates);
};

export const deleteSubmission = async (id: string): Promise<void> => {
  if (isMockMode()) {
    mockSubmissions = mockSubmissions.filter((s) => s.id !== id);
    notifyMockSubmissions();
    return;
  }

  await deleteDoc(doc(db, 'submissions', id));
};
