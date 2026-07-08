declare const puter: {
  auth: {
    signIn: (options?: { attempt_temp_user_creation?: boolean }) => Promise<boolean>;
    signOut: () => void;
    isSignedIn: () => boolean;
    getUser: () => Promise<{
      username: string;
      authToken?: string;
      uuid?: string;
      [key: string]: unknown;
    }>;
  };
  ai: {
    chat: (prompt: string, options?: Record<string, unknown>) => Promise<unknown>;
    txt2img: (prompt: string, testMode?: boolean) => Promise<HTMLElement>;
    txt2vid: (prompt: string) => Promise<HTMLElement>;
    txt2speech: (text: string, options?: Record<string, unknown>) => Promise<HTMLAudioElement>;
  };
  print: (content: string) => void;
  [key: string]: unknown;
};