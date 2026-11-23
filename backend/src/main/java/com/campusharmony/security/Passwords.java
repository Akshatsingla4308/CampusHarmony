package com.campusharmony.security;
import java.security.*;
import java.util.*;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public final class Passwords {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int ITERATIONS = 600000;
    private Passwords() {}
    public static String hash(String password) {
        if(password == null || password.length()<12 || password.length()>256)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Use a password of 12 to 256 characters");
        byte[] salt=new byte[16];
        RANDOM.nextBytes(salt);
        return ITERATIONS+"$"+Base64.getEncoder().encodeToString(salt)+"$"+Base64.getEncoder().encodeToString(derive(password,salt,ITERATIONS));
    }
    public static boolean matches(String password,String stored) {
        if(password==null || password.length()>256) return false;
        String[] parts=stored.split("\\$");
        return MessageDigest.isEqual(Base64.getDecoder().decode(parts[2]), derive(password,Base64.getDecoder().decode(parts[1]),Integer.parseInt(parts[0])));
    }
    private static byte[] derive(String password,byte[] salt,int rounds) {
        var spec=new PBEKeySpec(password.toCharArray(),salt,rounds,256);
        try {return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();}
        catch(GeneralSecurityException e){throw new IllegalStateException(e);}
        finally {spec.clearPassword();}
    }
}
