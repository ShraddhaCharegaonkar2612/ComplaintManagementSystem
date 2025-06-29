package security.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import security.jwt.jwt.JwtUtils;
import security.jwt.services.UserDetailsImpl;
import security.jwt.services.UserDetailsServiceImpl;
import security.payload.request.LoginRequest;
import security.payload.request.SignUpRequest;
import security.payload.request.ForgotPasswordRequest;
import security.payload.request.ResetPasswordRequest;
import security.payload.response.MessageResponse;
import security.payload.response.UserInfoResponse;
import security.pojo.ERole;
import security.pojo.Role;
import security.pojo.User;
import security.pojo.PasswordResetToken;
import security.repository.RoleRepository;
import security.repository.UserRepository;
import security.repository.PasswordResetTokenRepository;
import security.service.EmailService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
	@Autowired
	AuthenticationManager authenticationManager;
	@Autowired
	UserRepository userRepository;
	@Autowired
	RoleRepository roleRepository;
	@Autowired
	PasswordEncoder encoder;
	@Autowired
	JwtUtils jwtUtils;

	@Autowired
	PasswordResetTokenRepository passwordResetTokenRepository;

	@Autowired
	EmailService emailService;

	@PostMapping("/forgot-password")
	public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
		return userRepository.findByEmail(request.getEmail())
				.map(user -> {
					// Remove old OTPs
					passwordResetTokenRepository.deleteByUserId(user.getId());
					// Generate OTP (6 digit)
					String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
					java.util.Calendar cal = java.util.Calendar.getInstance();
					cal.add(java.util.Calendar.MINUTE, 10); // 10 min expiry
					PasswordResetToken resetToken = new PasswordResetToken(otp, user.getId(), cal.getTime());
					passwordResetTokenRepository.save(resetToken);
					// Send OTP via email
					emailService.sendEmail(user.getEmail(), "Password Reset OTP",
						"Your OTP for password reset is: " + otp + "\nIt is valid for 10 minutes.");
					return ResponseEntity.ok(new MessageResponse("OTP sent to your email."));
				})
				.orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("Email not found.")));
	}

	@PostMapping("/reset-password")
	public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
		return userRepository.findByEmail(request.getEmail())
				.map(user -> passwordResetTokenRepository.findByOtp(request.getOtp())
						.map(otpEntity -> {
							if (!otpEntity.getUserId().equals(user.getId())) {
								return ResponseEntity.badRequest().body(new MessageResponse("OTP does not match user."));
							}
							if (otpEntity.getExpiryDate().before(new java.util.Date())) {
								return ResponseEntity.badRequest().body(new MessageResponse("OTP expired."));
							}
							user.setPassword(encoder.encode(request.getNewPassword()));
							userRepository.save(user);
							passwordResetTokenRepository.deleteByUserId(user.getId());
							return ResponseEntity.ok(new MessageResponse("Password reset successful."));
						})
						.orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP."))))
				.orElseGet(() -> ResponseEntity.badRequest().body(new MessageResponse("Email not found.")));
	}

	@Autowired
	UserDetailsServiceImpl userDetailsService;

	@PostMapping("/signin")
	public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
		SecurityContextHolder.getContext().setAuthentication(authentication);
		String jwt = jwtUtils.generateJwtToken(authentication);
		UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
		ResponseCookie jwtCookie = jwtUtils.generateJwtCookie(userDetails);
		List<String> roles = userDetails.getAuthorities().stream().map(item -> item.getAuthority())
				.collect(Collectors.toList());
		return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, jwtCookie.toString()).body(new UserInfoResponse(
				userDetails.getId(), userDetails.getUsername(), userDetails.getEmail(), roles, jwt));
	}

	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
		if (userRepository.existsByUsername(signUpRequest.getUsername())) {
			return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
		}
		if (userRepository.existsByEmail(signUpRequest.getEmail())) {
			return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
		}
		// Create new user's account
		User user = new User(signUpRequest.getUsername(), signUpRequest.getEmail(),
				encoder.encode(signUpRequest.getPassword()));
		Set<String> strRoles = signUpRequest.getRoles();
		Set<Role> roles = new HashSet<>();
		if (strRoles == null) {
			Role userRole = roleRepository.findByName(ERole.ROLE_USER)
					.orElseThrow(() -> new RuntimeException("Error: Role is not found."));
			roles.add(userRole);
		} else {
			strRoles.forEach(role -> {
				switch (role) {
				case "admin":
					Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
							.orElseThrow(() -> new RuntimeException("Error: Role is not found."));
					roles.add(adminRole);
					break;
				case "merchant":
					Role attendeeRole = roleRepository.findByName(ERole.ROLE_MERCHANT)
							.orElseThrow(() -> new RuntimeException("Error: Role is not found."));
					roles.add(attendeeRole);
					break;
				default:
					Role userRole = roleRepository.findByName(ERole.ROLE_USER)
							.orElseThrow(() -> new RuntimeException("Error: Role is not found."));
					roles.add(userRole);
				}
			});
		}
		user.setRoles(roles);
		userRepository.save(user);
		return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
	}

	@GetMapping("/validateToken/{authorization}")
	public boolean validateToken(@PathVariable String authorization) {

		try {

			String jwt = parseJwt(authorization);

			if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
				String username = jwtUtils.getUserNameFromJwtToken(jwt);
				UserDetails userDetails = userDetailsService.loadUserByUsername(username);
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						userDetails, null, userDetails.getAuthorities());
				authentication.setDetails(new WebAuthenticationDetailsSource());// .buildDetails(request));

				SecurityContextHolder.getContext().setAuthentication(authentication);
				return true;
			} else {
				return false;
			}
		} catch (Exception e) {
			e.printStackTrace();
			return false;

		}

	}

	private String parseJwt(String authorization) {
		String headerAuth = authorization;

		if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
			return headerAuth.substring(7, headerAuth.length());
		}

		return null;
	}
}
