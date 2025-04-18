package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"os"
)

func getKey() ([]byte, error) {
	key := os.Getenv("TENANT_ENCRYPTION_KEY")
	if len(key) != 32 {
		return nil, errors.New("TENANT_ENCRYPTION_KEY must be 32 bytes long")
	}
	return []byte(key), nil
}

func Encrypt(plaintext string) (string, error) {
	key, err := getKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nil, nonce, []byte(plaintext), nil)
	final := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(final), nil
}

func Decrypt(encoded string) (string, error) {
	key, err := getKey()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	if len(data) < aesGCM.NonceSize() {
		return "", errors.New("ciphertext too short")
	}

	nonce := data[:aesGCM.NonceSize()]
	ciphertext := data[aesGCM.NonceSize():]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
