
interface Window {
    ethereum?: any;
    google?: {
      accounts: {
        id: {
          initialize: (options: any) => void;
          prompt: (callback: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          cancel: () => void;
        };
      };
    };
    Razorpay?: any;
}