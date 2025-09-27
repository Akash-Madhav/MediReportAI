'use client';

import Link from "next/link";
import { Atom, Mail, User as UserIcon, Shield } from "lucide-react";
import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "../icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.712,34.438,44,28.286,44,20C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
  }

export function LoginForm({ variant = 'login' }: { variant?: 'login' | 'signup' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const router = useRouter();
  const { toast } = useToast();

  const isLogin = variant === 'login';

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // For Google Sign-in, we can default the role to 'patient' and save to database
      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'patient' 
      });
      router.push('/dashboard');
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Failed",
        description: "Could not sign in with Google. Please try again.",
      });
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        // Save user info to database
        await set(ref(db, `users/${user.uid}`), {
          uid: user.uid,
          displayName: name,
          email: email,
          role: role,
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`Error during ${isLogin ? 'email sign-in' : 'email sign-up'}:`, error);
      
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'An account with this email already exists. Please sign in instead.';
      } else {
        description = error.message;
      }
      
      toast({
        variant: "destructive",
        title: `${isLogin ? 'Sign-in' : 'Sign-up'} Failed`,
        description,
      });
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <Logo className="h-12 w-12" />
        </div>
        <CardTitle className="font-headline text-2xl">{isLogin ? 'MediReportAI' : 'Create an Account'}</CardTitle>
        <CardDescription>
          {isLogin ? 'Sign in to access your health dashboard.' : 'Enter your details to get started.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleEmailAuth} className="grid gap-4">
            {!isLogin && (
              <div className="grid gap-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="grid gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             {!isLogin && (
              <div className="grid gap-2">
                <Label>I am a...</Label>
                <RadioGroup defaultValue="patient" value={role} onValueChange={setRole} className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="patient" id="patient" className="peer sr-only" />
                    <Label
                      htmlFor="patient"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <UserIcon className="mb-3 h-6 w-6" />
                      Patient
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="doctor" id="doctor" className="peer sr-only" />
                    <Label
                      htmlFor="doctor"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <Shield className="mb-3 h-6 w-6" />
                      Doctor
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            <Button type="submit" className="w-full">
                <Mail className="mr-2 h-5 w-5" />
                {isLogin ? 'Sign in with Email' : 'Create Account'}
            </Button>
        </form>

        <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
        </div>
        <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
            <GoogleIcon className="mr-2" />
            Sign in with Google
        </Button>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-center text-sm text-muted-foreground">
         {isLogin ? (
            <p>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline">
                    Sign up
                </Link>
            </p>
         ) : (
            <p>
                Already have an account?{" "}
                <Link href="/login" className="underline">
                    Sign in
                </Link>
            </p>
         )}
        <div className="flex items-center justify-center text-xs pt-2">
            <Atom className="mr-1 h-3 w-3" /> 
            Powered by Firebase & Google AI
        </div>
      </CardFooter>
    </Card>
  );
}
